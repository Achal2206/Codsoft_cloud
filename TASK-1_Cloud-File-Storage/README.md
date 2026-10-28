# ☁️ CodSoft Cloud Computing Internship - Task 1: Cloud File Storage System

A modern, secure, and production-ready **Cloud File Storage and Management System** developed as part of the **CodSoft Cloud Computing Internship**, powered by **Supabase Cloud Storage**.

---

## 🌟 Key Features

1. **Cloud Storage Engine**:
   - **Supabase Cloud Storage**: Real-time cloud storage powered by PostgreSQL/AWS S3 infrastructure via `@supabase/supabase-js`.
   - **Signed URLs**: Generates time-limited expiring signed URLs for private files and secure sharing.
   - **Public & Private Buckets**: Supports public download URLs and secure access control.
   - **Built-in Cloud Emulator**: Graceful local fallback if offline.

2. **File Operations**:
   - **Upload**: Drag-and-drop or file picker with real-time upload progress.
   - **Download**: High-performance streaming direct downloads from cloud storage.
   - **View / Preview**: In-browser preview for Images (PNG, JPG, SVG, WebP), PDFs, Audio files, and Code/Text files (`.txt`, `.js`, `.json`, `.yml`, `.py`, `.sql`).
   - **Delete**: Automated object deletion from Supabase cloud storage bucket and metadata registry.

3. **Security & Validation**:
   - **File Validation**: MIME-type verification, 50MB file size limits, and restriction of dangerous executables (`.exe`, `.bat`, `.cmd`, `.sh`, `.msi`).
   - **Data Integrity**: Cryptographic **SHA-256** checksum hash calculated and stored for every uploaded file.
   - **Granular Access Control (ACL)**: 1-click toggle between `🌐 Public` and `🔒 Private` access permissions.

4. **Bonus Feature - Shareable Download Links**:
   - Generates secure, tokenized download links using Supabase signed URLs.
   - Configurable link expiration (15 minutes, 1 hour, 24 hours, 7 days).
   - Automated expiration enforcement and download counting.

5. **Storage Analytics & Quotas**:
   - Visual quota tracker (e.g. `X MB / 1,024 MB Used`).
   - Category breakdowns (Documents, Images, Media, Code, Archives).
   - Search by file name and multi-category filtering.

---

## 📐 Cloud Architecture

```
[ Web Client / Browser ]
           │
           │  (REST API / Multipart Upload)
           ▼
[ Node.js / Express Server (Port 5001) ]
     │               │
     │ Checksum      │ Supabase SDK (@supabase/supabase-js)
     │ SHA-256       ▼
     ▼        ┌────────────────────────────────────────────────────────┐
 [Metadata]   │ Supabase Cloud Storage Engine                          │
              │ Bucket: codsoft-files (Public / Signed URLs)           │
              └────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Installation
Navigate to this directory and install dependencies:
```bash
npm install
```

### 2. Configure Supabase Cloud Storage
Create or edit your `.env` file:
```env
PORT=5001
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_KEY=<your-supabase-key>
SUPABASE_BUCKET=codsoft-files
```

### 3. Start the Server
```bash
npm start
# or
node server.js
```
Open your browser and navigate to:
```
http://localhost:5001
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Get cloud storage mode, quota, and category metrics |
| `GET` | `/api/files` | List stored files (supports `?q=`, `?category=`, `?access=`) |
| `POST` | `/api/files/upload` | Upload a file to Supabase with SHA-256 generation |
| `GET` | `/api/files/:id/view` | Stream inline preview of file from Supabase |
| `GET` | `/api/files/:id/download` | Download file attachment |
| `DELETE` | `/api/files/:id` | Delete file from Supabase bucket and metadata |
| `PATCH` | `/api/files/:id/permission` | Update file permission (`public` or `private`) |
| `POST` | `/api/files/:id/share` | Generate Supabase signed shareable link with expiration |
| `GET` | `/share/:token` | Public token-validated download redirect |

---

## 🎥 Demonstration Tips
1. Showcase the UI, highlighting the Supabase cloud connection badge and storage metrics.
2. Drag and drop an image or PDF to show the upload and SHA-256 hash calculation.
3. Preview the uploaded file inside the browser modal.
4. Click **Share** to generate an expiring Supabase signed URL link (Bonus feature).
5. Toggle access between **Public** and **Private** to demonstrate ACL permissions.
6. Delete a file to show real-time storage cleanup in Supabase bucket.
