const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late'],
        message: 'Status must be Present, Absent, or Late',
      },
      required: [true, 'Attendance status is required'],
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Remarks cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Normalize date to UTC midnight before saving to ensure strict unique constraint per calendar day
attendanceSchema.pre('validate', function (next) {
  if (this.date) {
    const d = new Date(this.date);
    d.setUTCHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

// CRITICAL COMPOUND UNIQUE INDEX:
// Prevents duplicate attendance entries for the same student, course, and date
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

// Performance Query Indexes:
// 1. For getting attendance roster of a course on a date
attendanceSchema.index({ course: 1, date: 1 });
// 2. For getting a student's attendance records across courses
attendanceSchema.index({ student: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
