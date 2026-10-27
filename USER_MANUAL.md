# User Manual: Student Attendance Management System
**Course:** BCSE302P – Database Systems Lab Review 3  

---

## 1. Getting Started & Logging In

1. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```
2. You will be greeted by the **Sign In** screen.
3. For immediate demonstration, use the **Quick 1-Click Demo Logins** located at the bottom of the login card:
   - Click **Admin Demo** to populate `admin@vit.ac.in` / `Admin@123`
   - Click **Faculty Demo** to populate `prof.sharma@vit.ac.in` / `Faculty@123`
4. Click **Sign In**.

---

## 2. Administrator Workflow

### A. Dashboard Overview
Upon logging in as an administrator, you have global visibility:
- **Metrics Bar:** Active student counts, total courses, system-wide attendance percentage, and active defaulters.
- **Defaulter Alert:** Direct alerts highlighting students with attendance under the 75% institutional requirement.
- **Recent Feed:** Live audit log of recently submitted attendance records.

### B. Student Management (`/students`)
1. **Search & Filter:** Search by name, registration number (e.g., `21BCE1001`), or filter by department/semester.
2. **Add New Student:** Click the **Add Student** button, fill in the registration number, name, email, department, semester, and section, then click **Save Student**.
3. **View Profile & Attendance:** Click the **Eye icon** next to any student to view their attendance rate, total sessions attended, and all currently enrolled courses.
4. **Edit / Delete Student:** Modify student details or remove a student record (which automatically cascades to clean associated enrollments and logs).

### C. Course Management (`/courses`)
1. **Create Course:** Click **Add Course**, input Course Code (e.g., `BCSE305L`), course title, semester, credits, and select the instructor from the faculty dropdown.
2. **View Course Roster:** Click **View Student Roster** on any course card to inspect all registered students.
3. **Edit / Delete Course:** Update course information or archive the course.

### D. Enrollment Management (`/enrollments`)
1. **Single Enrollment:** Click **Enroll Student**, pick the target course and student. If the student is already enrolled, MongoDB's unique compound index will prevent duplicate registration.
2. **Bulk Enrollment:** Click **Bulk Enroll**, select a course, and select multiple students with one-click checkboxes to register the whole class in seconds.
3. **Drop Enrollment:** Click the trash icon to drop a student from a course.

---

## 3. Faculty Workflow

### A. Taking Attendance (`/take-attendance`)
1. Navigate to **Mark Attendance** from the sidebar.
2. **Select Course:** Choose one of your assigned courses (e.g., `BCSE302P – Database Systems Lab`).
3. **Select Date:** Pick the lecture date (defaults to today).
4. The system automatically checks MongoDB:
   - If attendance has **already been logged** for that date, it loads the existing statuses for editing.
   - If **new**, all students default to **Present**.
5. **Quick Action:** Use **Mark All Present** or **Mark All Absent** to set initial states rapidly.
6. **Toggle Statuses:** Click **Present**, **Late**, or **Absent** buttons for individual students.
7. **Add Remarks:** Type any relevant notes (e.g., *"OD - Hackathon"*, *"Late 15m"*).
8. Click **Save Attendance Session** to commit all records to MongoDB atomically.

### B. Attendance Records & Corrections (`/attendance-history`)
1. Search and filter past records by Course, Status (Present/Late/Absent), and Date range.
2. **Correct Attendance:** Click the **Edit icon** on any record to adjust status or modify remarks with justification.
3. **Delete Record:** Remove an erroneous entry with the delete confirmation modal.

### C. CSV Export
1. On the **Attendance Records** page, apply any desired filters.
2. Click **Export Filtered CSV**.
3. A `.csv` file will immediately download to your computer, containing columns for Date, Student ID, Student Name, Course Code, Course Name, Status, Faculty, and Remarks.

---

## 4. Demonstrating MongoDB Analytics (`/analytics`)

During your Review 3 demonstration, navigate to **MongoDB Analytics** in the sidebar:
- **Tab 1 (Student Attendance %):** Shows individual attendance percentages computed server-side across all sessions.
- **Tab 2 (Course Attendance %):** Compares average attendance across courses.
- **Tab 3 (Daily Status Totals):** Demonstrates grouping by lecture date with status breakdowns.
- **Tab 4 (Defaulters Threshold):** Use the interactive slider to adjust the threshold (e.g., 70%, 75%, 80%) to show real-time MongoDB `$match` filtering.
- **Tab 5 (Monthly Trends):** Shows month-by-month attendance performance.
- **Tab 6 (Review 3 Pipeline Code):** Displays the exact MongoDB aggregation query pipeline code for viva explanation.
