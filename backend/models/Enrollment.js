const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    semester: {
      type: Number,
      default: 5,
    },
    academicYear: {
      type: String,
      default: '2025-2026',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Enrolled', 'Dropped', 'Completed'],
      default: 'Enrolled',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: A student cannot be enrolled in the same course more than once
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Secondary index for quick lookup of enrollments by course
enrollmentSchema.index({ course: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
