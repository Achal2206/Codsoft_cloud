// CodSoft Task 1: Cloud File Storage Client Application

let currentFiles = [];
let currentView = 'grid'; // 'grid' | 'table'
let currentCategory = 'all';
let currentAccessFilter = 'all';
let activeShareFileId = null;

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const btnBrowse = document.getElementById('btnBrowse');
const uploadProgressContainer = document.getElementById('uploadProgressContainer');
const uploadProgressBar = document.getElementById('uploadProgressBar');
const uploadStatusText = document.getElementById('uploadStatusText');
const uploadAccessPermission = document.getElementById('uploadAccessPermission');

const filesContainer = document.getElementById('filesContainer');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const accessFilter = document.getElementById('accessFilter');
const viewGridBtn = document.getElementById('viewGrid');
const viewTableBtn = document.getElementById('viewTable');

// Metric Elements
const quotaBar = document.getElementById('quotaBar');
const storagePercentText = document.getElementById('storagePercentText');
const usedStorageText = document.getElementById('usedStorageText');
const totalFilesCount = document.getElementById('totalFilesCount');
const publicCount = document.getElementById('publicCount');
const privateCount = document.getElementById('privateCount');
const cloudModeText = document.getElementById('cloudModeText');

// Modals
const shareModal = document.getElementById('shareModal');
const btnCloseShareModal = document.getElementById('btnCloseShareModal');
const shareFileName = document.getElementById('shareFileName');
const expiryDuration = document.getElementById('expiryDuration');
const btnCreateShareLink = document.getElementById('btnCreateShareLink');
const shareResult = document.getElementById('shareResult');
const shareUrlInput = document.getElementById('shareUrlInput');
const btnCopyShareUrl = document.getElementById('btnCopyShareUrl');
const shareExpiryNotice = document.getElementById('shareExpiryNotice');

const previewModal = document.getElementById('previewModal');
const btnClosePreviewModal = document.getElementById('btnClosePreviewModal');
const previewTitle = document.getElementById('previewTitle');
const previewBody = document.getElementById('previewBody');
const previewDownloadBtn = document.getElementById('previewDownloadBtn');

const archModal = document.getElementById('archModal');
const btnArchInfo = document.getElementById('btnArchInfo');
const btnCloseArchModal = document.getElementById('btnCloseArchModal');
const toastContainer = document.getElementById('toastContainer');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  fetchStatus();
  fetchFiles();
  setupEventListeners();
});

function setupEventListeners() {
  // Drag and Drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-active'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  dropzone.addEventListener('click', (e) => {
    if (e.target !== btnBrowse && !e.target.closest('.upload-options')) {
      fileInput.click();
    }
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileUpload(fileInput.files[0]);
    }
  });

  // Search & Filter
  searchInput.addEventListener('input', () => filterAndRenderFiles());
  
  categoryFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-chip')) {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.dataset.category;
      filterAndRenderFiles();
    }
  });

  accessFilter.addEventListener('change', (e) => {
    currentAccessFilter = e.target.value;
    filterAndRenderFiles();
  });

  // View switchers
  viewGridBtn.addEventListener('click', () => {
    currentView = 'grid';
    viewGridBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    renderFiles();
  });
  viewTableBtn.addEventListener('click', () => {
    currentView = 'table';
    viewTableBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    renderFiles();
  });

  // Modals
  btnCloseShareModal.addEventListener('click', () => shareModal.style.display = 'none');
  btnClosePreviewModal.addEventListener('click', () => previewModal.style.display = 'none');
  btnArchInfo.addEventListener('click', () => archModal.style.display = 'flex');
  btnCloseArchModal.addEventListener('click', () => archModal.style.display = 'none');

  // Close modals on backdrop click
  [shareModal, previewModal, archModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  });

  // Share link action
  btnCreateShareLink.addEventListener('click', generateShareLink);
  btnCopyShareUrl.addEventListener('click', copyShareUrl);
}

// Fetch Metrics & Status
async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    
    cloudModeText.textContent = `${data.mode} Online (${data.region})`;
    storagePercentText.textContent = `${data.usedPercentage}% Used`;
    quotaBar.style.width = `${Math.min(100, Math.max(2, data.usedPercentage))}%`;
    
    const usedMB = (data.usedBytes / (1024 * 1024)).toFixed(2);
    usedStorageText.textContent = `${usedMB} MB`;
    totalFilesCount.textContent = data.totalFiles;
  } catch (err) {
    console.error('Failed to load status', err);
  }
}

// Fetch Files
async function fetchFiles() {
  try {
    const res = await fetch('/api/files');
    const data = await res.json();
    if (data.success) {
      currentFiles = data.files;
      updatePermissionCounts();
      filterAndRenderFiles();
    }
  } catch (err) {
    showToast('Failed to load files from cloud storage.', 'error');
  }
}

function updatePermissionCounts() {
  const pub = currentFiles.filter(f => f.access === 'public').length;
  const priv = currentFiles.filter(f => f.access === 'private').length;
  publicCount.textContent = pub;
  privateCount.textContent = priv;
}

// Upload Handling
async function handleFileUpload(file) {
  // Client-side file validation
  const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.msi'];
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  
  if (dangerousExts.includes(ext)) {
    showToast(`Security Alert: "${ext}" files are not permitted for cloud safety!`, 'error');
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showToast('File size exceeds the 50MB limit.', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('access', uploadAccessPermission.value);

  // Show progress state
  uploadProgressContainer.style.display = 'flex';
  uploadProgressBar.style.width = '30%';
  uploadStatusText.textContent = `Uploading "${file.name}" to cloud storage...`;

  try {
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });

    uploadProgressBar.style.width = '100%';
    const data = await res.json();

    setTimeout(() => {
      uploadProgressContainer.style.display = 'none';
      uploadProgressBar.style.width = '0%';
    }, 500);

    if (data.success) {
      showToast(`✅ "${file.name}" uploaded successfully!`, 'success');
      fileInput.value = '';
      fetchFiles();
      fetchStatus();
    } else {
      showToast(data.message || 'Upload failed.', 'error');
    }
  } catch (err) {
    uploadProgressContainer.style.display = 'none';
    showToast('Error uploading file to server.', 'error');
  }
}

// Filter files in memory
let filteredFiles = [];
function filterAndRenderFiles() {
  const query = searchInput.value.toLowerCase().trim();
  filteredFiles = currentFiles.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(query);
    const matchesCategory = currentCategory === 'all' || file.category === currentCategory;
    const matchesAccess = currentAccessFilter === 'all' || file.access === currentAccessFilter;
    return matchesSearch && matchesCategory && matchesAccess;
  });

  renderFiles();
}

// Render Files
function renderFiles() {
  if (filteredFiles.length === 0) {
    filesContainer.innerHTML = `
      <div class="empty-state glass-panel">
        <div class="empty-state-icon">📂</div>
        <h3>No files found</h3>
        <p>No files match your current search or category filter. Drag and drop new files to store in the cloud.</p>
      </div>
    `;
    return;
  }

  if (currentView === 'grid') {
    renderGridView();
  } else {
    renderTableView();
  }
}

function getFileIcon(cat, ext) {
  if (cat === 'image') return '🖼️';
  if (cat === 'document') {
    if (ext.includes('pdf')) return '📕';
    if (ext.includes('doc')) return '📘';
    return '📄';
  }
  if (cat === 'media') return '🎬';
  if (cat === 'code') return '💻';
  if (cat === 'archive') return '📦';
  return '📁';
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(isoStr) {
  const date = new Date(isoStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderGridView() {
  const html = `
    <div class="files-grid">
      ${filteredFiles.map(file => {
        const ext = file.originalName.slice(file.originalName.lastIndexOf('.')).toLowerCase();
        const icon = getFileIcon(file.category, ext);
        const shortHash = file.sha256 ? `${file.sha256.substring(0, 10)}...` : 'hash';
        return `
          <div class="file-card glass-panel" data-id="${file.id}">
            <div class="file-card-top">
              <div class="file-icon-box">${icon}</div>
              <div class="file-card-info">
                <div class="file-name" title="${file.originalName}">${file.originalName}</div>
                <div class="file-meta-sub">
                  <span>${formatBytes(file.size)}</span>
                  <span>•</span>
                  <span>${formatDate(file.uploadedAt)}</span>
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; gap: 0.5rem;">
              <span class="file-badge-acl ${file.access}" onclick="toggleAccess('${file.id}', '${file.access}')" title="Click to toggle access permission">
                ${file.access === 'public' ? '🌐 Public' : '🔒 Private'}
              </span>
              ${file.provider === 'Google Drive' ? `<span class="badge-provider gdrive" title="Stored in Google Drive">Google Drive</span>` : `<span class="file-hash" title="SHA-256 Checksum: ${file.sha256}">SHA: ${shortHash}</span>`}
            </div>

            <div class="file-actions">
              <button class="file-action-btn" onclick="openPreview('${file.id}')" title="Preview">
                👁️ View
              </button>
              <a class="file-action-btn" href="/api/files/${file.id}/download" download title="Download">
                ⬇️ Get
              </a>
              ${file.webViewLink ? `<a class="file-action-btn btn-gdrive" href="${file.webViewLink}" target="_blank" rel="noopener noreferrer" title="Open in Google Drive">↗️ Drive</a>` : ''}
              <button class="file-action-btn" onclick="openShareModal('${file.id}', '${encodeURIComponent(file.originalName)}')" title="Generate Share Link">
                🔗 Share
              </button>
              <button class="file-action-btn btn-delete" onclick="deleteFile('${file.id}', '${encodeURIComponent(file.originalName)}')" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  filesContainer.innerHTML = html;
}

function renderTableView() {
  const html = `
    <div class="files-table-wrapper glass-panel">
      <table class="files-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Size</th>
            <th>Access</th>
            <th>SHA-256 Hash</th>
            <th>Uploaded</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filteredFiles.map(file => {
            const ext = file.originalName.slice(file.originalName.lastIndexOf('.')).toLowerCase();
            const icon = getFileIcon(file.category, ext);
            const shortHash = file.sha256 ? `${file.sha256.substring(0, 12)}...` : '-';
            return `
              <tr>
                <td>
                  <div style="display:flex; align-items:center; gap: 0.5rem;">
                    <span>${icon}</span>
                    <strong style="color:var(--text-main); font-size:0.9rem;">${file.originalName}</strong>
                    ${file.provider === 'Google Drive' ? '<span class="badge-provider gdrive mini">Drive</span>' : ''}
                  </div>
                </td>
                <td><span style="text-transform:capitalize; color:var(--text-muted);">${file.category}</span></td>
                <td>${formatBytes(file.size)}</td>
                <td>
                  <span class="file-badge-acl ${file.access}" onclick="toggleAccess('${file.id}', '${file.access}')" style="cursor:pointer;" title="Click to change permission">
                    ${file.access === 'public' ? '🌐 Public' : '🔒 Private'}
                  </span>
                </td>
                <td><code style="font-size:0.75rem; color:#94a3b8;">${shortHash}</code></td>
                <td style="color:var(--text-muted); font-size:0.8rem;">${formatDate(file.uploadedAt)}</td>
                <td style="text-align: right;">
                  <button class="file-action-btn" style="display:inline-flex;" onclick="openPreview('${file.id}')">View</button>
                  <a class="file-action-btn" style="display:inline-flex;" href="/api/files/${file.id}/download" download>Download</a>
                  ${file.webViewLink ? `<a class="file-action-btn btn-gdrive" style="display:inline-flex;" href="${file.webViewLink}" target="_blank" rel="noopener noreferrer">Drive ↗</a>` : ''}
                  <button class="file-action-btn" style="display:inline-flex;" onclick="openShareModal('${file.id}', '${encodeURIComponent(file.originalName)}')">Share</button>
                  <button class="file-action-btn btn-delete" style="display:inline-flex;" onclick="deleteFile('${file.id}', '${encodeURIComponent(file.originalName)}')">Delete</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
  filesContainer.innerHTML = html;
}

// Toggle Access Permission
async function toggleAccess(fileId, currentAccess) {
  const newAccess = currentAccess === 'public' ? 'private' : 'public';
  try {
    const res = await fetch(`/api/files/${fileId}/permission`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access: newAccess })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Permission updated to ${newAccess.toUpperCase()}`, 'info');
      fetchFiles();
    }
  } catch (e) {
    showToast('Failed to update permission', 'error');
  }
}

// Delete File
async function deleteFile(fileId, encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Are you sure you want to permanently delete "${name}" from Cloud Storage?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`🗑️ "${name}" deleted from cloud storage.`, 'success');
      fetchFiles();
      fetchStatus();
    } else {
      showToast(data.message || 'Delete failed', 'error');
    }
  } catch (err) {
    showToast('Error deleting file', 'error');
  }
}

// Preview File Modal
async function openPreview(fileId) {
  const file = currentFiles.find(f => f.id === fileId);
  if (!file) return;

  previewTitle.textContent = `Viewing: ${file.originalName}`;
  previewDownloadBtn.href = `/api/files/${file.id}/download`;

  previewBody.innerHTML = '<div style="text-align:center; padding:2rem;"><div class="upload-spinner" style="margin:0 auto 1rem;"></div>Loading preview...</div>';
  previewModal.style.display = 'flex';

  const ext = file.originalName.slice(file.originalName.lastIndexOf('.')).toLowerCase();
  const fileUrl = `/api/files/${file.id}/view`;

  if (file.category === 'image') {
    previewBody.innerHTML = `
      <div class="preview-content-box">
        <img src="${fileUrl}" alt="${file.originalName}">
      </div>
      <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.5rem; display:flex; justify-content:space-between;">
        <span>Size: ${formatBytes(file.size)}</span>
        <span>MIME: ${file.mimeType}</span>
      </div>
    `;
  } else if (file.mimeType === 'application/pdf') {
    previewBody.innerHTML = `
      <div class="preview-content-box" style="height:480px;">
        <iframe src="${fileUrl}" style="width:100%; height:100%; border:none; border-radius:6px;"></iframe>
      </div>
    `;
  } else if (file.category === 'media' && file.mimeType.startsWith('audio/')) {
    previewBody.innerHTML = `
      <div class="preview-content-box" style="flex-direction:column; gap:1rem;">
        <span style="font-size:3rem;">🎵</span>
        <audio controls src="${fileUrl}" style="width:100%;"></audio>
      </div>
    `;
  } else if (['.txt', '.json', '.js', '.css', '.html', '.md', '.yml', '.yaml', '.py', '.sql'].includes(ext)) {
    try {
      const res = await fetch(fileUrl);
      const text = await res.text();
      previewBody.innerHTML = `
        <div class="preview-content-box">
          <pre>${escapeHtml(text.slice(0, 5000))}${text.length > 5000 ? '\n... (truncated for preview)' : ''}</pre>
        </div>
      `;
    } catch (e) {
      previewBody.innerHTML = `<p style="color:var(--text-muted); text-align:center;">Preview not available for this text file.</p>`;
    }
  } else {
    previewBody.innerHTML = `
      <div class="preview-content-box" style="flex-direction:column; gap:1rem; padding:3rem 1rem;">
        <span style="font-size:3.5rem;">📄</span>
        <h4>Preview not supported in browser</h4>
        <p style="color:var(--text-muted); font-size:0.85rem;">This file format (${file.mimeType}) can be downloaded directly.</p>
      </div>
    `;
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Share Modal (Bonus Feature)
function openShareModal(fileId, encodedName) {
  activeShareFileId = fileId;
  const name = decodeURIComponent(encodedName);
  shareFileName.textContent = name;
  shareResult.style.display = 'none';
  shareModal.style.display = 'flex';
}

async function generateShareLink() {
  if (!activeShareFileId) return;
  const duration = expiryDuration.value;

  try {
    const res = await fetch(`/api/files/${activeShareFileId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes: duration })
    });
    const data = await res.json();
    if (data.success) {
      shareUrlInput.value = data.shareUrl;
      const expireTime = new Date(data.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
      shareExpiryNotice.textContent = `⏳ Token link expires on: ${expireTime}`;
      shareResult.style.display = 'flex';
      showToast('Shareable link generated!', 'success');
    }
  } catch (err) {
    showToast('Failed to create shareable link', 'error');
  }
}

function copyShareUrl() {
  shareUrlInput.select();
  navigator.clipboard.writeText(shareUrlInput.value).then(() => {
    showToast('📋 Link copied to clipboard!', 'info');
  }).catch(() => {
    document.execCommand('copy');
    showToast('📋 Link copied!', 'info');
  });
}

// Toast System
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
