const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Ensure .env is loaded regardless of process execution directory
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    project: 'Student Attendance Management System',
    course: 'BCSE302P Database Systems Lab Review 3',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// 404 & Error Handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Student Attendance Management Backend Running!`);
  console.log(` Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Mongo URI: ${process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_attendance_db'}`);
  console.log(`====================================================`);
});
