# Student Attendance Management System (BCSE302P Review 3)

A full-stack, enterprise-grade Student Attendance Management System built with **React**, **Node.js/Express**, and **MongoDB with Mongoose**. Engineered specifically for the **BCSE302P – Database Systems Lab Review 3** evaluation.

---

## 🌟 Highlights & Review 3 Alignment

- **MongoDB Design**: 5 core collections (`users`, `students`, `courses`, `enrollments`, `attendance`) with strict schema validation, referential integrity via `ObjectId`, and compound unique indexes.
- **5 MongoDB Aggregation Pipelines**: Server-side analytical reports for student percentage, course-wide percentage, daily status breakdown, configurable defaulter thresholds (< 75%), and monthly trends.
- **Role-Based Access Control (RBAC)**: JWT-authenticated Admin and Faculty roles with protected backend middleware.
- **Idempotent Sample Data**: Automated seeder creating **497 documents** across all collections, with built-in reset and demo credentials.
- **Modern Responsive UI**: React 18, Vite, Tailwind CSS, Lucide icons, live attendance toggles, and 1-click CSV export.

---

## 🏗️ System Architecture

```
[ Client: React + Vite + Tailwind ]
            │  (REST API with JWT Bearer Token)
            ▼
[ Server: Express.js (Port 5000) ]
      ├── Auth & RBAC Middleware
      ├── Schema Validation & Business Logic
      └── MongoDB Aggregation Engine
            │  (Mongoose ODM)
            ▼
[ Database: MongoDB Server (Port 27017) ]
      ├── users
      ├── students
      ├── courses
      ├── enrollments  (Compound Unique: student + course)
      └── attendance   (Compound Unique: student + course + date)
```

---

## 📋 Prerequisites

Before running the application, make sure you have:

1. **Node.js** (v18.0.0 or higher, verified on Node v24)
2. **npm** (v9.0.0 or higher)
3. **MongoDB Community Server** (v6.0+ or v9.0, running on default port `27017`)
4. **MongoDB Compass** (optional GUI for inspecting database collections and indexes)

---

## 🚀 Setup & Execution (Step-by-Step)

### 1. Database Connection & MongoDB Compass Setup
1. Open **MongoDB Compass**.
2. Connect to the default connection URI:
   ```
   mongodb://127.0.0.1:27017
   ```
3. Once connected, your database `student_attendance_db` will automatically appear after running the seed script below.

### 2. Configure Environment Variables
A `.env` file is already prepared in `backend/.env`. You can inspect or modify it:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_attendance_db
JWT_SECRET=supersecretjwtkey_bcse302p_labreview3_vit
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Seed Database with Realistic Data (497 Documents)
Run the automated idempotent seeding script from the root project folder:
```powershell
npm run seed
```
*Or from inside the backend directory:*
```powershell
cd backend
npm run seed
```
This drops any existing test records, validates schemas, generates realistic VIT student registrations (`21BCE1001` - `21BCE1030`), courses (`BCSE302P`, `BCSE301L`, etc.), enrollments, and 360 attendance logs over 10 dates.

### 4. Run Full Application (Frontend + Backend)
From the root directory:
```powershell
npm run dev
```
This runs both:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:3000`

*Alternatively, you can run them in separate terminals:*
```powershell
# Terminal 1 - Backend:
cd backend
npm run dev

# Terminal 2 - Frontend:
cd frontend
npm run dev
```

---

## 🔑 Demo Login Credentials

The application provides **1-Click Demo Login buttons** on the sign-in screen, or you can manually enter:

| Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@vit.ac.in` | `Admin@123` | Full access: Manage users, faculty, students, courses, enrollments, attendance, and analytics |
| **Faculty (DB Lab)** | `prof.sharma@vit.ac.in` | `Faculty@123` | Take attendance for assigned courses (`BCSE302P`, `BCSE308L`), view enrolled students, and edit logs |
| **Faculty (DSA)** | `prof.anita@vit.ac.in` | `Faculty@123` | Take attendance for assigned courses (`BCSE301L`, `BCSE309P`), view class reports |

---

## 📊 The 5 MongoDB Aggregation Pipelines

Implemented in `backend/controllers/analyticsController.js` and exposed in the **MongoDB Analytics** page:

1. **Student Attendance Percentage**:
   - Computes individual attendance percentages across all sessions using `$group`, `$cond`, `$multiply`, `$divide`, and joins student details via `$lookup`.
2. **Course Attendance Percentage**:
   - Calculates aggregated attendance percentage for each course offering, joining course and faculty details.
3. **Daily Attendance Breakdown by Status**:
   - Chronological breakdown by `$date` showing counts of Present, Late, and Absent students.
4. **Defaulter List with Dynamic Threshold**:
   - Identifies non-compliant students with attendance below a configurable threshold (e.g., `< 75%` or `< 80%`) via a post-grouping `$match` stage and computes the shortfall.
5. **Monthly Attendance Trends**:
   - Aggregates velocity over time using `$dateToString: { format: "%Y-%m", date: "$date" }`.

---

## 📁 Repository Structure

```
├── backend/
│   ├── config/            # Database connection (Mongoose)
│   ├── controllers/       # Business logic & Aggregation pipelines
│   ├── middleware/        # JWT Protect, RBAC & Error handlers
│   ├── models/            # 5 Mongoose Schemas & Unique Indexes
│   ├── routes/            # Express REST route definitions
│   ├── seed/              # Safe, idempotent database seeder
│   ├── .env.example       # Sample environment configuration
│   ├── package.json       # Backend dependencies
│   └── server.js          # Express app bootstrap
├── frontend/
│   ├── src/
│   │   ├── api/           # Centralized API fetch client
│   │   ├── components/    # Reusable UI (Navbar, Sidebar, Modal, StatCard)
│   │   ├── context/       # AuthContext with token persistence
│   │   ├── pages/         # 7 Full-featured application pages
│   │   ├── App.jsx        # Routing configuration
│   │   └── main.jsx       # React entry point
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Proxy configuration to port 5000
│   └── tailwind.config.js # Modern styling system
├── DATABASE_DESIGN.md     # Comprehensive database schema documentation
├── USER_MANUAL.md         # Walkthrough guide for Admin & Faculty
├── FINAL_REPORT.md        # Formatted BCSE302P Review 3 final report
├── PRESENTATION_SLIDES.md # 8-10 slide presentation script
├── VIVA_QUESTIONS.md      # Expected viva review questions & answers
└── README.md              # Project instructions (this file)
```

---

## 🛠️ Troubleshooting

- **MongoDB Service Not Started**:
  In Windows PowerShell (Run as Administrator):
  ```powershell
  Start-Service MongoDB
  ```
- **Port 5000 or 3000 in use**:
  Ensure no background node processes are holding the ports:
  ```powershell
  Get-Process -Name node | Stop-Process
  ```
- **Resetting the Database**:
  Simply re-run `npm run seed` to refresh all 497 documents cleanly.
