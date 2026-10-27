const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_attendance_db';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('\n[1/6] Cleaning existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Attendance.deleteMany({}),
    ]);
    console.log('Cleaned old records safely.');

    console.log('\n[2/6] Seeding User Accounts (Admin & Faculty)...');
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const facultyPassword = await bcrypt.hash('Faculty@123', 10);

    const usersData = [
      {
        name: 'Dr. R. Ramanathan (Admin)',
        email: 'admin@vit.ac.in',
        password: adminPassword,
        role: 'admin',
        department: 'School of Computer Science & Engineering',
        phone: '+91 98401 12345',
        status: 'active',
      },
      {
        name: 'Prof. Suresh Sharma',
        email: 'prof.sharma@vit.ac.in',
        password: facultyPassword,
        role: 'faculty',
        department: 'Computer Science & Engineering',
        phone: '+91 98401 23456',
        status: 'active',
      },
      {
        name: 'Dr. Anita Deshmukh',
        email: 'prof.anita@vit.ac.in',
        password: facultyPassword,
        role: 'faculty',
        department: 'Computer Science & Engineering',
        phone: '+91 98401 34567',
        status: 'active',
      },
      {
        name: 'Prof. Rajesh Nair',
        email: 'prof.rajesh@vit.ac.in',
        password: facultyPassword,
        role: 'faculty',
        department: 'Information Technology',
        phone: '+91 98401 45678',
        status: 'active',
      },
    ];

    // Using insertMany with pre-hashed passwords
    const createdUsers = await User.insertMany(usersData);
    const adminUser = createdUsers[0];
    const facultySharma = createdUsers[1];
    const facultyAnita = createdUsers[2];
    const facultyRajesh = createdUsers[3];
    console.log(`Created ${createdUsers.length} user accounts.`);

    console.log('\n[3/6] Seeding Courses...');
    const coursesData = [
      {
        code: 'BCSE302P',
        name: 'Database Systems Lab',
        department: 'Computer Science & Engineering',
        semester: 5,
        credits: 2,
        faculty: facultySharma._id,
        description: 'Hands-on database design, SQL querying, and NoSQL MongoDB aggregation pipelines.',
      },
      {
        code: 'BCSE301L',
        name: 'Data Structures and Algorithms',
        department: 'Computer Science & Engineering',
        semester: 5,
        credits: 4,
        faculty: facultyAnita._id,
        description: 'Design and analysis of efficient algorithms, trees, graphs, and dynamic programming.',
      },
      {
        code: 'BCSE303P',
        name: 'Operating Systems Lab',
        department: 'Computer Science & Engineering',
        semester: 5,
        credits: 2,
        faculty: facultyRajesh._id,
        description: 'Process synchronization, CPU scheduling algorithms, and shell scripting.',
      },
      {
        code: 'BCSE308L',
        name: 'Computer Networks',
        department: 'Computer Science & Engineering',
        semester: 5,
        credits: 3,
        faculty: facultySharma._id,
        description: 'OSI and TCP/IP models, routing protocols, flow control, and network security.',
      },
      {
        code: 'BCSE309P',
        name: 'Web Technology Lab',
        department: 'Computer Science & Engineering',
        semester: 5,
        credits: 2,
        faculty: facultyAnita._id,
        description: 'Full-stack web application development using modern MERN stack framework.',
      },
    ];

    const createdCourses = await Course.insertMany(coursesData);
    console.log(`Created ${createdCourses.length} courses.`);

    console.log('\n[4/6] Seeding Students (30 Students)...');
    const studentNames = [
      { id: '21BCE1001', name: 'Aarav Sharma', sec: 'A' },
      { id: '21BCE1002', name: 'Diya Patel', sec: 'A' },
      { id: '21BCE1003', name: 'Rohan Gupta', sec: 'A' },
      { id: '21BCE1004', name: 'Ananya Iyer', sec: 'A' },
      { id: '21BCE1005', name: 'Ishaan Verma', sec: 'A' },
      { id: '21BCE1006', name: 'Kavya Nair', sec: 'A' },
      { id: '21BCE1007', name: 'Aditya Kulkarni', sec: 'A' },
      { id: '21BCE1008', name: 'Sneha Reddy', sec: 'A' },
      { id: '21BCE1009', name: 'Vikram Joshi', sec: 'A' },
      { id: '21BCE1010', name: 'Pooja Hegde', sec: 'A' },
      { id: '21BCE1011', name: 'Harsh Vardhan', sec: 'B' },
      { id: '21BCE1012', name: 'Tanvi Mehra', sec: 'B' },
      { id: '21BCE1013', name: 'Kunal Roy', sec: 'B' },
      { id: '21BCE1014', name: 'Meera Chawla', sec: 'B' },
      { id: '21BCE1015', name: 'Siddharth Sen', sec: 'B' },
      { id: '21BCE1016', name: 'Riya Singhania', sec: 'B' },
      { id: '21BCE1017', name: 'Arjun Das', sec: 'B' },
      { id: '21BCE1018', name: 'Nisha Pillai', sec: 'B' },
      { id: '21BCE1019', name: 'Pranav Menon', sec: 'B' },
      { id: '21BCE1020', name: 'Shruti Rao', sec: 'B' },
      { id: '21BCE1021', name: 'Gautam Banerjee', sec: 'A' },
      { id: '21BCE1022', name: 'Priyanka Ghosh', sec: 'A' },
      { id: '21BCE1023', name: 'Nikhil Agarwal', sec: 'A' },
      { id: '21BCE1024', name: 'Swati Saxena', sec: 'A' },
      { id: '21BCE1025', name: 'Devendra Bhat', sec: 'B' },
      { id: '21BCE1026', name: 'Ritika Malhotra', sec: 'B' },
      { id: '21BCE1027', name: 'Manoj Tiwari', sec: 'B' },
      { id: '21BCE1028', name: 'Divya Nambiar', sec: 'B' },
      { id: '21BCE1029', name: 'Suraj Pandey', sec: 'A' },
      { id: '21BCE1030', name: 'Kritika Oberoi', sec: 'A' },
    ];

    const studentsData = studentNames.map((s, index) => {
      const emailName = s.name.toLowerCase().replace(/\s+/g, '.');
      return {
        studentId: s.id,
        name: s.name,
        email: `${emailName}${s.id.slice(-4)}@vitstudent.ac.in`,
        department: index % 5 === 0 ? 'Information Technology' : 'Computer Science & Engineering',
        year: 3,
        semester: 5,
        section: s.sec,
        phone: `+91 97890 ${10000 + index}`,
        status: 'Active',
      };
    });

    const createdStudents = await Student.insertMany(studentsData);
    console.log(`Created ${createdStudents.length} student profiles.`);

    console.log('\n[5/6] Seeding Enrollments...');
    // Enroll students in courses:
    // All 30 students in BCSE302P (Database Systems Lab)
    // First 20 students in BCSE301L (Data Structures)
    // First 18 students in BCSE303P (OS Lab)
    // Last 15 students in BCSE308L (Computer Networks)
    // Last 15 students in BCSE309P (Web Tech Lab)
    const dbCourse = createdCourses[0];
    const dsaCourse = createdCourses[1];
    const osCourse = createdCourses[2];
    const cnCourse = createdCourses[3];
    const wtCourse = createdCourses[4];

    const enrollmentsData = [];

    createdStudents.forEach((student) => {
      // All in DB Lab
      enrollmentsData.push({
        student: student._id,
        course: dbCourse._id,
        semester: 5,
        academicYear: '2025-2026',
        status: 'Enrolled',
      });
    });

    createdStudents.slice(0, 20).forEach((student) => {
      enrollmentsData.push({
        student: student._id,
        course: dsaCourse._id,
        semester: 5,
        academicYear: '2025-2026',
        status: 'Enrolled',
      });
    });

    createdStudents.slice(0, 18).forEach((student) => {
      enrollmentsData.push({
        student: student._id,
        course: osCourse._id,
        semester: 5,
        academicYear: '2025-2026',
        status: 'Enrolled',
      });
    });

    createdStudents.slice(15, 30).forEach((student) => {
      enrollmentsData.push({
        student: student._id,
        course: cnCourse._id,
        semester: 5,
        academicYear: '2025-2026',
        status: 'Enrolled',
      });
      enrollmentsData.push({
        student: student._id,
        course: wtCourse._id,
        semester: 5,
        academicYear: '2025-2026',
        status: 'Enrolled',
      });
    });

    const createdEnrollments = await Enrollment.insertMany(enrollmentsData);
    console.log(`Created ${createdEnrollments.length} enrollments across courses.`);

    console.log('\n[6/6] Seeding Attendance Records across Multiple Dates...');
    // Lecture dates over past 2 months (e.g. Aug, Sep, Oct) to generate monthly trends!
    const sessionDates = [
      new Date('2026-08-10T00:00:00.000Z'),
      new Date('2026-08-17T00:00:00.000Z'),
      new Date('2026-08-24T00:00:00.000Z'),
      new Date('2026-09-02T00:00:00.000Z'),
      new Date('2026-09-09T00:00:00.000Z'),
      new Date('2026-09-16T00:00:00.000Z'),
      new Date('2026-09-23T00:00:00.000Z'),
      new Date('2026-10-05T00:00:00.000Z'),
      new Date('2026-10-12T00:00:00.000Z'),
      new Date('2026-10-19T00:00:00.000Z'),
    ];

    const attendanceRecords = [];

    // For BCSE302P (Database Systems Lab taught by Prof. Sharma)
    // We mark attendance for all 30 students across the 10 dates (300 records!)
    // To ensure realistic variance and test Pipeline 4 (Defaulters < 75%),
    // Student index 8 (Vikram Joshi), index 13 (Meera Chawla), index 27 (Divya Nambiar)
    // will have low attendance (<75%).
    const lowAttendanceStudentIndices = [8, 13, 27];

    sessionDates.forEach((date, dateIdx) => {
      createdStudents.forEach((student, studentIdx) => {
        let status = 'Present';
        let remarks = '';

        if (lowAttendanceStudentIndices.includes(studentIdx)) {
          // Absent in most classes to trigger < 75% defaulter threshold
          if (dateIdx % 3 !== 0) {
            status = 'Absent';
            remarks = 'Uninformed leave';
          }
        } else {
          // Normal variance
          const rand = (studentIdx + dateIdx * 3) % 17;
          if (rand === 0) {
            status = 'Absent';
            remarks = 'Sick leave / unwell';
          } else if (rand === 1) {
            status = 'Late';
            remarks = 'Late by 15 mins due to bus delay';
          }
        }

        attendanceRecords.push({
          student: student._id,
          course: dbCourse._id,
          faculty: facultySharma._id,
          date: date,
          status,
          remarks,
        });
      });
    });

    // Also seed a few dates for BCSE301L (DSA) with Prof. Anita
    const dsaDates = [
      new Date('2026-09-05T00:00:00.000Z'),
      new Date('2026-09-12T00:00:00.000Z'),
      new Date('2026-10-03T00:00:00.000Z'),
      new Date('2026-10-10T00:00:00.000Z'),
    ];

    createdStudents.slice(0, 15).forEach((student, studentIdx) => {
      dsaDates.forEach((date, dateIdx) => {
        attendanceRecords.push({
          student: student._id,
          course: dsaCourse._id,
          faculty: facultyAnita._id,
          date: date,
          status: (studentIdx + dateIdx) % 7 === 0 ? 'Absent' : 'Present',
          remarks: (studentIdx + dateIdx) % 7 === 0 ? 'OD - Technical Symposium' : '',
        });
      });
    });

    const createdAttendance = await Attendance.insertMany(attendanceRecords);
    console.log(`Created ${createdAttendance.length} attendance records across sessions.`);

    console.log('\n======================================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log(` Total Users:       ${createdUsers.length}`);
    console.log(` Total Courses:     ${createdCourses.length}`);
    console.log(` Total Students:    ${createdStudents.length}`);
    console.log(` Total Enrollments: ${createdEnrollments.length}`);
    console.log(` Total Attendance:  ${createdAttendance.length}`);
    console.log(` TOTAL DOCUMENTS:   ${createdUsers.length + createdCourses.length + createdStudents.length + createdEnrollments.length + createdAttendance.length}`);
    console.log('\n DEMO LOGIN CREDENTIALS:');
    console.log(' -----------------------------------------------------');
    console.log(' 1. Admin Role:');
    console.log('    Email:    admin@vit.ac.in');
    console.log('    Password: Admin@123');
    console.log(' -----------------------------------------------------');
    console.log(' 2. Faculty Role (Prof. Suresh Sharma - DB Lab):');
    console.log('    Email:    prof.sharma@vit.ac.in');
    console.log('    Password: Faculty@123');
    console.log(' -----------------------------------------------------');
    console.log(' 3. Faculty Role (Dr. Anita Deshmukh - DSA/Web Tech):');
    console.log('    Email:    prof.anita@vit.ac.in');
    console.log('    Password: Faculty@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
