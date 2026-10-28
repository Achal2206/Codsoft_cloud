const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

// AWS SDK v3 imports (optional)
let S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, getSignedUrl;
try {
  const s3 = require('@aws-sdk/client-s3');
  const presigner = require('@aws-sdk/s3-request-presigner');
  S3Client = s3.S3Client;
  PutObjectCommand = s3.PutObjectCommand;
  GetObjectCommand = s3.GetObjectCommand;
  DeleteObjectCommand = s3.DeleteObjectCommand;
  getSignedUrl = presigner.getSignedUrl;
} catch (e) {
  // AWS optional
}

// Azure Blob Storage SDK imports
let BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions;
try {
  const azureBlob = require('@azure/storage-blob');
  BlobServiceClient = azureBlob.BlobServiceClient;
  StorageSharedKeyCredential = azureBlob.StorageSharedKeyCredential;
  generateBlobSASQueryParameters = azureBlob.generateBlobSASQueryParameters;
  BlobSASPermissions = azureBlob.BlobSASPermissions;
} catch (e) {
  console.log('[Notice] Azure Storage SDK optional components loaded.');
}

// Supabase Cloud Storage SDK imports
let supabaseClient = null;
let supabaseBucket = process.env.SUPABASE_BUCKET || 'codsoft-files';
let isSupabaseConfigured = false;

try {
  const { createClient } = require('@supabase/supabase-js');
  const sUrl = process.env.SUPABASE_URL;
  const sKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (sUrl && sKey) {
    supabaseClient = createClient(sUrl, sKey);
    isSupabaseConfigured = true;
    console.log(`[Cloud] Supabase Storage SDK initialized (URL: ${sUrl}, Bucket: ${supabaseBucket})`);
  }
} catch (e) {
  console.log('[Notice] Supabase SDK optional notice:', e.message);
}

// Google Drive API imports
let googleDriveClient = null;
let googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
let isGoogleDriveConfigured = false;
let googleDriveAccountEmail = null;

try {
  const { google } = require('googleapis');
  const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || path.join(__dirname, 'service-account.json');

  if (fs.existsSync(keyFilePath)) {
    try {
      const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      googleDriveAccountEmail = keyData.client_email;
    } catch (e) {}

    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    googleDriveClient = google.drive({ version: 'v3', auth });
    isGoogleDriveConfigured = true;
    console.log(`[Cloud] Google Drive API initialized via Service Account Key file: ${path.basename(keyFilePath)} (${googleDriveAccountEmail || 'ready'})`);
  } else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    googleDriveAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive']
    );
    googleDriveClient = google.drive({ version: 'v3', auth });
    isGoogleDriveConfigured = true;
    console.log(`[Cloud] Google Drive API initialized via .env Service Account credentials (${googleDriveAccountEmail})`);
  }
} catch (e) {
  console.log('[Notice] Google Drive SDK notice:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Paths
const BUCKET_DIR = path.join(__dirname, 'storage_bucket');
const DATA_FILE = path.join(__dirname, 'data', 'files.json');
const SHARES_FILE = path.join(__dirname, 'data', 'shares.json');

if (!fs.existsSync(BUCKET_DIR)) fs.mkdirSync(BUCKET_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(DATA_FILE))) fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

// Cloud Storage Provider Detection: Google Drive vs Azure vs AWS vs Local Cloud Emulator
const isAzureConfigured = Boolean(
  BlobServiceClient && (
    process.env.AZURE_STORAGE_CONNECTION_STRING ||
    (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY)
  )
);

const isAwsConfigured = Boolean(
  S3Client &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION &&
  process.env.AWS_BUCKET_NAME
);

let azureContainerClient = null;
let activeProvider = 'Local Cloud Storage Emulator';

const preferredProvider = (process.env.STORAGE_PROVIDER || '').toLowerCase();

if (preferredProvider === 'supabase' || (!process.env.STORAGE_PROVIDER && isSupabaseConfigured)) {
  if (isSupabaseConfigured) {
    activeProvider = 'Supabase Cloud Storage';
    console.log(`[Cloud] Active Provider: Supabase Cloud Storage (Bucket: ${supabaseBucket})`);
  }
} else if (preferredProvider === 'google-drive' || (!process.env.STORAGE_PROVIDER && isGoogleDriveConfigured)) {
  if (isGoogleDriveConfigured) {
    activeProvider = 'Google Drive Cloud Storage';
    console.log(`[Cloud] Active Provider: Google Drive (Target Folder: ${googleDriveFolderId || 'Root'})`);
  }
} else if (preferredProvider === 'azure' || (!process.env.STORAGE_PROVIDER && isAzureConfigured)) {
  if (isAzureConfigured) {
    activeProvider = 'Microsoft Azure Blob Storage';
  }
} else if (preferredProvider === 'aws' || (!process.env.STORAGE_PROVIDER && isAwsConfigured)) {
  if (isAwsConfigured) {
    activeProvider = 'AWS S3 Cloud';
  }
}

// Fallback to whichever cloud is configured
if (activeProvider === 'Local Cloud Storage Emulator') {
  if (isSupabaseConfigured) {
    activeProvider = 'Supabase Cloud Storage';
  } else if (isGoogleDriveConfigured) {
    activeProvider = 'Google Drive Cloud Storage';
  } else if (isAzureConfigured) {
    activeProvider = 'Microsoft Azure Blob Storage';
  } else if (isAwsConfigured) {
    activeProvider = 'AWS S3 Cloud';
  } else {
    activeProvider = 'Local Cloud Storage (Azure/S3/Drive Emulator)';
    console.log('[Cloud] Operating in Local Storage Simulation Mode.');
  }
}

if (isAzureConfigured) {
  try {
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'codsoft-cloud-container';
    let blobServiceClient;
    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    } else {
      const sharedKey = new StorageSharedKeyCredential(
        process.env.AZURE_STORAGE_ACCOUNT_NAME,
        process.env.AZURE_STORAGE_ACCOUNT_KEY
      );
      blobServiceClient = new BlobServiceClient(
        `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
        sharedKey
      );
    }
    azureContainerClient = blobServiceClient.getContainerClient(containerName);
    azureContainerClient.createIfNotExists().catch(() => {});
    if (activeProvider === 'Microsoft Azure Blob Storage') {
      console.log(`[Cloud] Connected to Azure Blob Storage Container: "${containerName}"`);
    }
  } catch (err) {
    console.error('[Cloud] Azure connection warning:', err.message);
  }
} else if (isAwsConfigured && activeProvider === 'AWS S3 Cloud') {
  console.log(`[Cloud] Connected to AWS S3 Bucket: ${process.env.AWS_BUCKET_NAME}`);
}

// Data store helpers
function readData(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return defaultVal;
  }
}

function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Pre-populate demo cloud files if empty
if (!fs.existsSync(DATA_FILE) || readData(DATA_FILE).length === 0) {
  const sampleFiles = [
    {
      id: 'demo-sample-architecture',
      originalName: 'Azure_Cloud_Architecture_Overview.pdf',
      storedName: 'sample_azure_arch.pdf',
      mimeType: 'application/pdf',
      size: 428900,
      category: 'document',
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      access: 'public',
      uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      provider: 'Azure Blob Storage'
    },
    {
      id: 'demo-cloud-diagram',
      originalName: 'Azure_Infrastructure_Diagram.png',
      storedName: 'sample_diagram.png',
      mimeType: 'image/png',
      size: 184500,
      category: 'image',
      sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      access: 'private',
      uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      provider: 'Azure Blob Storage'
    },
    {
      id: 'demo-config-template',
      originalName: 'azure-pipelines.cloud.yml',
      storedName: 'azure-pipelines.cloud.yml',
      mimeType: 'text/yaml',
      size: 4520,
      category: 'code',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      access: 'public',
      uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      provider: 'Azure Blob Storage'
    }
  ];

  fs.writeFileSync(path.join(BUCKET_DIR, 'sample_azure_arch.pdf'), '%PDF-1.4\n%CodSoft Cloud Computing Task 1 Azure Blob Storage Sample Document\n%%EOF');
  
  const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(path.join(BUCKET_DIR, 'sample_diagram.png'), minimalPng);
  
  fs.writeFileSync(
    path.join(BUCKET_DIR, 'azure-pipelines.cloud.yml'),
    'trigger:\n- main\npool:\n  vmImage: ubuntu-latest\nsteps:\n- task: AzureWebApp@1\n  inputs:\n    azureSubscription: "CodSoft-Azure-Subscription"\n    appName: "codsoft-cloud-storage"\n'
  );

  writeData(DATA_FILE, sampleFiles);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BUCKET_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.com'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (dangerousExtensions.includes(ext)) {
    return cb(new Error(`File type ${ext} is restricted for cloud security reasons.`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function categorizeMime(mimeType, ext) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) return 'media';
  if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.csv', '.xlsx'].includes(ext)) return 'document';
  if (['.js', '.json', '.html', '.css', '.py', '.yml', '.yaml', '.ts', '.sql'].includes(ext)) return 'code';
  if (['.zip', '.tar', '.gz', '.7z', '.rar'].includes(ext)) return 'archive';
  return 'other';
}

// 1. System Status & Storage Quota
app.get('/api/status', (req, res) => {
  const files = readData(DATA_FILE, []);
  const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const maxQuotaBytes = 1024 * 1024 * 1024; // 1 GB simulated cloud quota

  const statsByCategory = {
    image: 0,
    document: 0,
    media: 0,
    code: 0,
    archive: 0,
    other: 0
  };

  files.forEach(f => {
    const cat = f.category || 'other';
    statsByCategory[cat] = (statsByCategory[cat] || 0) + (f.size || 0);
  });

  let containerOrBucket = 'Local Cloud Bucket';
  let region = 'Local (Offline Emulator)';

  if (activeProvider === 'Supabase Cloud Storage') {
    containerOrBucket = `Bucket: ${supabaseBucket}`;
    region = 'Supabase Cloud (ap-south-1 Mumbai / AWS)';
  } else if (activeProvider === 'Google Drive Cloud Storage') {
    containerOrBucket = googleDriveFolderId ? `Drive Folder: ${googleDriveFolderId}` : 'Google Drive (Root)';
    region = googleDriveAccountEmail ? `Google Cloud (${googleDriveAccountEmail})` : 'Google Cloud Platform (Global)';
  } else if (activeProvider === 'Microsoft Azure Blob Storage') {
    containerOrBucket = process.env.AZURE_STORAGE_CONTAINER_NAME || 'codsoft-cloud-container';
    region = process.env.AZURE_REGION || 'Azure Central India / East US';
  } else if (activeProvider === 'AWS S3 Cloud') {
    containerOrBucket = process.env.AWS_BUCKET_NAME || 'codsoft-aws-bucket';
    region = process.env.AWS_REGION || 'us-east-1';
  }

  res.json({
    mode: activeProvider,
    bucketName: containerOrBucket,
    region: region,
    totalFiles: files.length,
    usedBytes: totalBytes,
    maxQuotaBytes,
    usedPercentage: ((totalBytes / maxQuotaBytes) * 100).toFixed(2),
    categoryBreakdown: statsByCategory,
    isGoogleDriveConfigured,
    googleDriveFolderId: googleDriveFolderId || null,
    googleDriveEmail: googleDriveAccountEmail || null
  });
});

// 2. List Files with Search & Filter
app.get('/api/files', (req, res) => {
  const { q, category, access } = req.query;
  let files = readData(DATA_FILE, []);

  if (q) {
    const query = q.toLowerCase();
    files = files.filter(f => f.originalName.toLowerCase().includes(query));
  }
  if (category && category !== 'all') {
    files = files.filter(f => f.category === category);
  }
  if (access && access !== 'all') {
    files = files.filter(f => f.access === access);
  }

  files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json({ success: true, count: files.length, files });
});

// 3. Upload File (Supports Google Drive, Azure Blob Storage, AWS S3, or Local Cloud Emulator)
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const ext = path.extname(req.file.originalname).toLowerCase();
    const category = categorizeMime(req.file.mimetype, ext);
    const access = req.body.access === 'private' ? 'private' : 'public';

    let cloudKey = req.file.filename;
    let provider = activeProvider;
    let driveFileId = null;
    let webViewLink = null;
    let webContentLink = null;

    // Direct Upload to Supabase Storage if active
    if (supabaseClient && (activeProvider === 'Supabase Cloud Storage' || preferredProvider === 'supabase')) {
      try {
        const { data: sUpload, error: sErr } = await supabaseClient.storage
          .from(supabaseBucket)
          .upload(req.file.filename, fileBuffer, {
            contentType: req.file.mimetype || 'application/octet-stream',
            upsert: true
          });
        if (sErr) throw sErr;
        const { data: pubData } = supabaseClient.storage.from(supabaseBucket).getPublicUrl(req.file.filename);
        webViewLink = pubData ? pubData.publicUrl : null;
        webContentLink = pubData ? pubData.publicUrl : null;
        provider = 'Supabase Cloud Storage';
        cloudKey = req.file.filename;
        console.log(`[Supabase Storage] File successfully uploaded to bucket "${supabaseBucket}": ${req.file.filename}`);
      } catch (sError) {
        console.error('[Supabase Storage Upload Error]:', sError.message);
      }
    } else if (googleDriveClient && (activeProvider === 'Google Drive Cloud Storage' || preferredProvider === 'google-drive')) {
      try {
        let driveUpload;
        try {
          const fileMetadata = {
            name: req.file.originalname,
            parents: googleDriveFolderId ? [googleDriveFolderId] : undefined
          };
          const media = {
            mimeType: req.file.mimetype || 'application/octet-stream',
            body: fs.createReadStream(filePath)
          };
          driveUpload = await googleDriveClient.files.create({
            requestBody: fileMetadata,
            media: media,
            supportsAllDrives: true,
            fields: 'id, name, webViewLink, webContentLink, size'
          });
        } catch (folderErr) {
          if (googleDriveFolderId && (folderErr.message.includes('not a folder') || folderErr.message.includes('File not found'))) {
            console.warn(`[Google Drive Warning]: Folder ID "${googleDriveFolderId}" is not a standard folder (${folderErr.message}). Uploading directly...`);
            driveUpload = await googleDriveClient.files.create({
              requestBody: { name: req.file.originalname },
              media: {
                mimeType: req.file.mimetype || 'application/octet-stream',
                body: fs.createReadStream(filePath)
              },
              supportsAllDrives: true,
              fields: 'id, name, webViewLink, webContentLink, size'
            });
          } else {
            throw folderErr;
          }
        }

        driveFileId = driveUpload.data.id;
        webViewLink = driveUpload.data.webViewLink;
        webContentLink = driveUpload.data.webContentLink;
        provider = 'Google Drive';
        cloudKey = driveFileId;

        // If access is public, set Google Drive permissions to anyone with link
        if (access === 'public') {
          try {
            await googleDriveClient.permissions.create({
              fileId: driveFileId,
              supportsAllDrives: true,
              requestBody: {
                role: 'reader',
                type: 'anyone'
              }
            });
          } catch (permErr) {
            console.warn('[Google Drive Permission Notice]:', permErr.message);
          }
        }
        console.log(`[Google Drive] File uploaded successfully to Drive: ${driveFileId}`);
      } catch (driveErr) {
        console.error('[Google Drive Upload Error]:', driveErr.message);
      }
    } else if (azureContainerClient) {
      // Direct Upload to Azure Blob Storage if configured
      try {
        const blockBlobClient = azureContainerClient.getBlockBlobClient(req.file.filename);
        await blockBlobClient.uploadData(fileBuffer, {
          blobHTTPHeaders: { blobContentType: req.file.mimetype },
          metadata: {
            originalName: encodeURIComponent(req.file.originalname),
            sha256: hash
          }
        });
        provider = 'Microsoft Azure Blob Storage';
        cloudKey = req.file.filename;
      } catch (azureErr) {
        console.error('[Azure Blob Storage Upload Error]:', azureErr.message);
      }
    }

    const newRecord = {
      id: crypto.randomUUID(),
      originalName: req.file.originalname,
      storedName: req.file.filename,
      cloudKey,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
      category,
      sha256: hash,
      access,
      uploadedAt: new Date().toISOString(),
      provider,
      driveFileId,
      webViewLink,
      webContentLink
    };

    const files = readData(DATA_FILE, []);
    files.unshift(newRecord);
    writeData(DATA_FILE, files);

    res.status(201).json({
      success: true,
      message: `File successfully uploaded to ${provider}.`,
      file: newRecord
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: error.message || 'File upload failed.' });
  }
});

// 4. View / Stream File
app.get('/api/files/:id/view', async (req, res) => {
  try {
    const files = readData(DATA_FILE, []);
    const file = files.find(f => f.id === req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);

    const localPath = path.join(BUCKET_DIR, file.storedName);
    if (fs.existsSync(localPath)) {
      return fs.createReadStream(localPath).pipe(res);
    }

    if (file.provider === 'Supabase Cloud Storage' && supabaseClient) {
      const { data: sBlob, error: sErr } = await supabaseClient.storage.from(supabaseBucket).download(file.storedName);
      if (!sErr && sBlob) {
        const buf = Buffer.from(await sBlob.arrayBuffer());
        return res.send(buf);
      }
    }

    if (file.driveFileId && googleDriveClient) {
      const driveStream = await googleDriveClient.files.get(
        { fileId: file.driveFileId, alt: 'media' },
        { responseType: 'stream' }
      );
      return driveStream.data.pipe(res);
    }

    res.status(404).json({ success: false, message: 'Physical file not found in storage.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Download File
app.get('/api/files/:id/download', async (req, res) => {
  try {
    const files = readData(DATA_FILE, []);
    const file = files.find(f => f.id === req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const localPath = path.join(BUCKET_DIR, file.storedName);
    if (fs.existsSync(localPath)) {
      return res.download(localPath, file.originalName);
    }

    if (file.provider === 'Supabase Cloud Storage' && supabaseClient) {
      const { data: sBlob, error: sErr } = await supabaseClient.storage.from(supabaseBucket).download(file.storedName);
      if (!sErr && sBlob) {
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);
        const buf = Buffer.from(await sBlob.arrayBuffer());
        return res.send(buf);
      }
    }

    if (file.driveFileId && googleDriveClient) {
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimeType);
      const driveStream = await googleDriveClient.files.get(
        { fileId: file.driveFileId, alt: 'media' },
        { responseType: 'stream' }
      );
      return driveStream.data.pipe(res);
    }

    res.status(404).json({ success: false, message: 'File not found on disk or cloud.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Delete File (Deletes from Google Drive, Azure Blob, and Local Cache)
app.delete('/api/files/:id', async (req, res) => {
  try {
    const files = readData(DATA_FILE, []);
    const index = files.findIndex(f => f.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const file = files[index];

    // Supabase Storage Delete
    if (file.provider === 'Supabase Cloud Storage' && supabaseClient) {
      try {
        await supabaseClient.storage.from(supabaseBucket).remove([file.storedName]);
        console.log(`[Supabase Storage] Deleted file: ${file.storedName}`);
      } catch (err) {
        console.warn('Supabase Delete warning:', err.message);
      }
    }

    // Google Drive Delete
    if (file.driveFileId && googleDriveClient) {
      try {
        await googleDriveClient.files.delete({ fileId: file.driveFileId });
        console.log(`[Google Drive] Deleted file ID: ${file.driveFileId}`);
      } catch (err) {
        console.warn('Google Drive Delete warning:', err.message);
      }
    }

    // Azure Blob Delete
    if (azureContainerClient) {
      try {
        const blockBlobClient = azureContainerClient.getBlockBlobClient(file.storedName);
        await blockBlobClient.deleteIfExists();
      } catch (err) {
        console.warn('Azure Blob Delete warning:', err.message);
      }
    }

    // Delete local cached file
    const localPath = path.join(BUCKET_DIR, file.storedName);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (e) {}
    }

    // Remove from shares
    let shares = readData(SHARES_FILE, []);
    shares = shares.filter(s => s.fileId !== file.id);
    writeData(SHARES_FILE, shares);

    files.splice(index, 1);
    writeData(DATA_FILE, files);

    res.json({ success: true, message: 'File permanently deleted from cloud storage.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Update Access Permission (Public/Private ACL)
app.patch('/api/files/:id/permission', async (req, res) => {
  try {
    const { access } = req.body;
    if (!['public', 'private'].includes(access)) {
      return res.status(400).json({ success: false, message: 'Invalid access permission.' });
    }

    const files = readData(DATA_FILE, []);
    const file = files.find(f => f.id === req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Google Drive Permission Update
    if (file.driveFileId && googleDriveClient) {
      try {
        if (access === 'public') {
          await googleDriveClient.permissions.create({
            fileId: file.driveFileId,
            requestBody: { role: 'reader', type: 'anyone' }
          });
        } else {
          const perms = await googleDriveClient.permissions.list({ fileId: file.driveFileId });
          const anyonePerm = perms.data.permissions?.find(p => p.type === 'anyone');
          if (anyonePerm) {
            await googleDriveClient.permissions.delete({
              fileId: file.driveFileId,
              permissionId: anyonePerm.id
            });
          }
        }
      } catch (e) {
        console.warn('[Google Drive Permission update warning]:', e.message);
      }
    }

    file.access = access;
    writeData(DATA_FILE, files);

    res.json({ success: true, message: `Access set to ${access}`, file });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Generate Shareable Link (Bonus: Supabase / Azure SAS URL / Google Drive link Compatible)
app.post('/api/files/:id/share', async (req, res) => {
  const { durationMinutes = 60 } = req.body;
  const files = readData(DATA_FILE, []);
  const file = files.find(f => f.id === req.params.id);

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + parseInt(durationMinutes) * 60 * 1000).toISOString();

  // If Supabase Storage is configured, generate Supabase signed URL
  let supabaseSignedUrl = null;
  if (supabaseClient && file.provider === 'Supabase Cloud Storage') {
    try {
      const { data: signedData, error: signErr } = await supabaseClient.storage
        .from(supabaseBucket)
        .createSignedUrl(file.storedName, parseInt(durationMinutes) * 60);
      if (!signErr && signedData) {
        supabaseSignedUrl = signedData.signedUrl;
      }
    } catch (e) {
      console.warn('Supabase signed URL error:', e.message);
    }
  }

  // If Azure SharedKey is configured, generate real Azure Blob SAS token
  let azureSasUrl = null;
  if (
    process.env.AZURE_STORAGE_ACCOUNT_NAME &&
    process.env.AZURE_STORAGE_ACCOUNT_KEY &&
    StorageSharedKeyCredential &&
    generateBlobSASQueryParameters
  ) {
    try {
      const sharedKey = new StorageSharedKeyCredential(
        process.env.AZURE_STORAGE_ACCOUNT_NAME,
        process.env.AZURE_STORAGE_ACCOUNT_KEY
      );
      const sasToken = generateBlobSASQueryParameters({
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'codsoft-cloud-container',
        blobName: file.storedName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + parseInt(durationMinutes) * 60 * 1000)
      }, sharedKey).toString();

      azureSasUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME || 'codsoft-cloud-container'}/${file.storedName}?${sasToken}`;
    } catch (e) {
      console.warn('SAS token generation error:', e.message);
    }
  }

  const shares = readData(SHARES_FILE, []);
  const shareRecord = {
    token,
    fileId: file.id,
    fileName: file.originalName,
    createdAt: new Date().toISOString(),
    expiresAt,
    durationMinutes: parseInt(durationMinutes),
    downloadsCount: 0,
    azureSasUrl,
    supabaseSignedUrl,
    googleDriveLink: file.webViewLink || null
  };

  shares.push(shareRecord);
  writeData(SHARES_FILE, shares);

  const protocol = req.protocol;
  const host = req.get('host');
  const shareUrl = supabaseSignedUrl || azureSasUrl || `${protocol}://${host}/share/${token}`;

  res.json({
    success: true,
    shareUrl,
    token,
    expiresAt,
    expiresInMinutes: durationMinutes,
    azureSasUrl: Boolean(azureSasUrl),
    supabaseSignedUrl: Boolean(supabaseSignedUrl),
    googleDriveLink: file.webViewLink || null
  });
});

// 9. Public Share Access Handler
app.get('/share/:token', (req, res) => {
  const shares = readData(SHARES_FILE, []);
  const share = shares.find(s => s.token === req.params.token);

  if (!share) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Link Expired or Invalid</title><style>body{font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#f8fafc;}a{color:#38bdf8;}</style></head>
      <body>
        <h1>⚠️ Invalid or Expired Azure Share Link</h1>
        <p>This cloud download link is no longer valid or has been revoked.</p>
        <p><a href="/">Return to Cloud Dashboard</a></p>
      </body>
      </html>
    `);
  }

  if (new Date() > new Date(share.expiresAt)) {
    return res.status(410).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Link Expired</title><style>body{font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#f8fafc;}a{color:#38bdf8;}</style></head>
      <body>
        <h1>⌛ Azure Share Link Expired</h1>
        <p>This secure cloud download link expired on <strong>${new Date(share.expiresAt).toLocaleString()}</strong>.</p>
        <p><a href="/">Return to Cloud Dashboard</a></p>
      </body>
      </html>
    `);
  }

  const files = readData(DATA_FILE, []);
  const file = files.find(f => f.id === share.fileId);

  if (!file) {
    return res.status(404).send('File has been removed by the owner.');
  }

  const localPath = path.join(BUCKET_DIR, file.storedName);
  if (!fs.existsSync(localPath)) {
    return res.status(404).send('Physical file missing.');
  }

  share.downloadsCount = (share.downloadsCount || 0) + 1;
  writeData(SHARES_FILE, shares);

  res.download(localPath, file.originalName);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File is too large! Maximum allowed is 50MB.' });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Task 1: Cloud File Storage System (${activeProvider}) running at http://localhost:${PORT}`);
});
