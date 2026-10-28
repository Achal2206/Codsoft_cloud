# ☁️ CodSoft Cloud Computing Internship

This repository contains the complete, production-ready implementation of **Tasks 1, 3, and 5** for the **CodSoft Cloud Computing Virtual Internship**.

---

## 📋 Selected Tasks Overview

| Task # | Project Name | Port | Description & Key Technologies |
|:---:|:---|:---:|:---|
| Task # | Project Name | Port | Description & Key Technologies |
|:---:|:---|:---:|:---|
| **Task 1** | **[Cloud File Storage System](./TASK-1_Cloud-File-Storage)** | `5001` | **Supabase Cloud Storage** (`@supabase/supabase-js` with signed URLs & public bucket), SHA-256 checks, ACL permissions & preview. |
| **Task 3** | **[Cloud Bus Ticket Reservation](./TASK-3_Bus-Ticket-Reservation)** | `5002` | High-traffic reservation system, Azure App Service / Container Apps architecture, 2D coach layout, optimistic 5-min seat leasing & PNR e-ticket. |
| **Task 5** | **[Cloud Student Management System](./TASK-5_Student-Management-System)** | `5003` | Multi-role academic portal (Admin, Teacher, Student), Azure Database & App Service deployment ready, attendance roster & analytics dashboard. |

---

## 🛠️ Repository Structure

```
codsoft/
├── TASK-1_Cloud-File-Storage/
│   ├── public/                # Web UI (HTML5, Vanilla CSS, JS)
│   ├── storage_bucket/        # Local storage cache / fallback
│   ├── data/                  # Persistent cloud metadata store
│   ├── server.js              # Node.js/Express API with Supabase Cloud Storage SDK
│   ├── package.json
│   └── README.md
│
├── TASK-3_Bus-Ticket-Reservation/
│   ├── public/                # Interactive 2D Seat Matrix & E-Ticket UI
│   ├── data/                  # Routes, Bookings & Concurrency Lease store
│   ├── server.js              # Seat locking engine & High-traffic REST API
│   ├── package.json
│   └── README.md
│
├── TASK-5_Student-Management-System/
│   ├── public/                # Academic Portal with 1-click Role Switcher
│   ├── data/                  # Students, Courses, Attendance & Grades store
│   ├── server.js              # RBAC middleware & Analytics REST API
│   ├── package.json
│   └── README.md
│
├── docker-compose.yml         # Container configuration for Azure Container Apps / Docker
├── run_all_tasks.bat          # 1-Click launcher to run all 3 apps together
├── run_task_1.bat             # 1-Click launcher for Task 1
├── run_task_3.bat             # 1-Click launcher for Task 3
├── run_task_5.bat             # 1-Click launcher for Task 5
├── package.json               # Root launcher scripts
├── .gitignore
└── README.md                  # Master documentation (this file)
```

---

## 🚀 Running the Projects

Each project is completely self-contained with its own dependencies, frontend, and backend server.

### Task 1: Cloud File Storage System
```bash
cd TASK-1_Cloud-File-Storage
npm install
npm start
```
> Open browser at: **`http://localhost:5001`**

### Task 3: Cloud Bus Ticket Reservation System
```bash
cd TASK-3_Bus-Ticket-Reservation
npm install
npm start
```
> Open browser at: **`http://localhost:5002`**

### Task 5: Cloud Student Management System
```bash
cd TASK-5_Student-Management-System
npm install
npm start
```
> Open browser at: **`http://localhost:5003`**

*(Or from root directory: `npm run start:task1`, `npm run start:task3`, `npm run start:task5`)*

---

## 📑 Feature Verification Checklist

### ✅ Task 1: Cloud File Storage System
- [x] Cloud-based application for uploading and managing files
- [x] Secure upload, download, in-browser preview, and deletion
- [x] Dual-mode storage engine: official **AWS S3 SDK (`@aws-sdk/client-s3`)** + Local S3-Compatible Bucket Emulator
- [x] File validation (size limit enforcement, executable restriction, SHA-256 integrity hash)
- [x] Granular Access Control (1-click toggle between `🌐 Public` and `🔒 Private`)
- [x] **Bonus**: Secure tokenized shareable links with configurable TTL (15m, 1h, 24h, 7d) and automatic expiration

### ✅ Task 3: Cloud-Based Bus Ticket Reservation System
- [x] Cloud-hosted online bus ticket booking platform
- [x] Search routes with origin, destination, date, and bus type filters
- [x] Interactive 2D Luxury Bus Seat Map (Window, Aisle, Lower/Upper decks)
- [x] High-concurrency design: **Atomic Ephemeral Seat Leasing with 5-minute countdown** to prevent double-booking
- [x] Cloud database storage for verified reservations
- [x] Digital Boarding Pass / E-Ticket with QR code and print support
- [x] Manage & Cancel booking with 90% refund calculation and instant seat release

### ✅ Task 5: Cloud-Based Student Management System
- [x] Cloud application to manage student records and academic information
- [x] Persistent cloud database for profiles, courses, attendance, and grades
- [x] Role-Based Access Control (RBAC) with 1-click switcher for **Admin**, **Teacher**, and **Student**
- [x] Teacher attendance roster with 1-click status toggles (`Present`, `Late`, `Absent`)
- [x] Gradebook with automated weighted average calculation (Assignments 25%, Midterm 35%, Final 40%)
- [x] Student portal with attendance tracking, low attendance warnings (<75%), and printable official transcript
- [x] **Bonus**: Analytics Dashboard featuring institutional **Grade Distribution Chart**, academic risk alerts, and CSV export

---

## 🌐 LinkedIn Submission Post Template

When submitting your tasks to LinkedIn as required by CodSoft instructions, you can use the following post format:

```markdown
🚀 Excited to share that I have completed the Cloud Computing Internship tasks with CodSoft!

Over the course of this internship, I developed and deployed 3 cloud systems:

1️⃣ Task 1: Cloud File Storage System
- Multi-engine storage (AWS S3 & Local S3 Bucket emulator)
- SHA-256 data integrity checksums & Access Control Lists (Public/Private)
- Expiring shareable download links (15m - 7d)

2️⃣ Task 3: Cloud Bus Ticket Reservation System
- High-concurrency seat leasing architecture preventing double-booking races
- Interactive 2D coach layout & digital boarding passes with QR codes
- Real-time booking management and cancellation with refund computation

3️⃣ Task 5: Cloud-Based Student Management System
- Role-Based Access Control (RBAC) for Admins, Teachers, and Students
- Attendance tracking with warning thresholds & weighted gradebook
- Performance analytics dashboard with canvas grade distribution chart

Check out the full GitHub repository: [INSERT YOUR GITHUB REPO LINK]

A big thank you to @CodSoft for this practical learning opportunity!

#codsoft #internship #cloudcomputing #webdevelopment #aws #nodejs #javascript
```

---

## 📦 How to Push to GitHub

To submit your project to CodSoft according to the instructions (`CODSOFT_TASKSNO`):

1. Initialize git in this folder:
   ```bash
   git init
   git add .
   git commit -m "Complete CodSoft Cloud Computing Internship Tasks 1, 3, and 5"
   ```
2. Create a new repository on GitHub named `CODSOFT_TASKSNO` (e.g., `CODSOFT_TASK1_3_5`).
3. Connect and push your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/CODSOFT_TASKSNO.git
   git branch -M main
   git push -u origin main
   ```
4. Copy the repository URL for your task submission form and LinkedIn post!
