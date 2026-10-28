# 🎓 CodSoft Cloud Computing Internship - Task 5: Cloud-Based Student Management System

A cloud-native, multi-role **Student Information and Academic Management System (SMS)** engineered with **Role-Based Access Control (RBAC)** and real-time **Academic Analytics**, developed for the **CodSoft Cloud Computing Internship**.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**:
   - 👑 **Administrator**:
     - System overview metrics (Total students, Active courses, Mean CGPA, At-risk count).
     - Full CRUD student directory management (Add, search, delete).
     - Course catalog management (Code, title, instructor, credits, schedule, room).
     - Institutional academic analytics.
   - 👩‍🏫 **Teacher / Faculty**:
     - Course-level instruction switchboard.
     - Interactive **Daily Attendance Roster**: 1-click status toggles (`Present`, `Late`, `Absent`) with date selection.
     - **Digital Gradebook**: Input Assignment (25%), Midterm (35%), and Final Exam (40%) scores with real-time automatic weighted calculation, letter grades (`A+` to `F`), and GPA points.
   - 👨‍🎓 **Student**:
     - Student profile card with roll number, department, semester, cumulative CGPA, and academic honors.
     - Enrolled courses with instructor, room, and timetable.
     - **Attendance Tracking**: Visual progress and early warning flags for low attendance (<75%).
     - **Official Transcript Generation**: Printable official academic record.

2. **Bonus Feature - Interactive Academic Analytics Dashboard**:
   - Canvas-rendered institutional **Grade Distribution Bar Chart** (A/A+, A-, B/B+, B-, C/C+, D/F).
   - **Academic Intervention Risk Radar**: Highlights students requiring academic support due to low GPA (<2.5) or attendance deficits.
   - **CSV Report Exporter**: Download raw records for external institutional reporting.

3. **1-Click Role Switcher**:
   - Built-in instant role switcher bar for fast evaluation without typing credentials:
     - 👑 Admin: *Dr. Arvind Mehta (Dean)*
     - 👩‍🏫 Teacher: *Prof. Ananya Sharma (Dept Head)*
     - 👨‍🎓 Student: *Alex Rivera (Roll 26CS042)*

---

## 📐 Cloud Architecture

```
                    [ Cloud Identity / RBAC ]
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
        [ Admin ]         [ Teacher ]       [ Student ]
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
            [ Node.js / Express Cloud Server (5003) ]
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
    [ Cloud Relational DB ]           [ Analytics Engine ]
    (Students, Courses, Attendance)   (GPA & Attendance Distribution)
```

---

## 🚀 Quick Start Guide

### 1. Installation
Navigate to this directory and install dependencies:
```bash
npm install
```

### 2. Start the Server
```bash
npm start
# or
node server.js
```

### 3. Open Application
Navigate in your browser to:
```
http://localhost:5003
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user and issue role session token |
| `GET` | `/api/students` | List student directory (supports search `?search=`) |
| `POST` | `/api/students` | Create new student profile (Admin) |
| `PUT` | `/api/students/:id` | Update student profile |
| `DELETE` | `/api/students/:id` | Delete student record (Admin) |
| `GET` | `/api/courses` | List academic course catalog |
| `POST` | `/api/courses` | Register new course (Admin) |
| `GET` | `/api/attendance` | Retrieve attendance records (filtered by course and date) |
| `POST` | `/api/attendance` | Record attendance roster (Teacher) |
| `GET` | `/api/grades` | Retrieve gradebook entries |
| `POST` | `/api/grades` | Submit/update student grades (Teacher) |
| `GET` | `/api/student-portal/:id` | Consolidated student portal with courses, attendance %, and grades |
| `GET` | `/api/analytics` | Institutional grade distribution and academic warning analytics |

---

## 🎥 LinkedIn Video Demonstration Tips
1. Use the top navigation role switcher to show **Admin View**; review the stats cards and open the **Analytics Dashboard** to show the canvas grade distribution chart.
2. Click **+ Add Student** to demonstrate adding a new student to the cloud database.
3. Switch to **Teacher View**; select course `CS-301 Cloud Computing Architecture` and demonstrate recording attendance on the interactive roster.
4. Open the **Submit Grades** tab, modify an exam score to show live weighted calculation, and click **Save Grades**.
5. Switch to **Student View** to show how the student immediately sees updated grades, attendance percentages, and GPA.
