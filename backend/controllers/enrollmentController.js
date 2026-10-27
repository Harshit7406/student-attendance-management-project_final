const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Course = require('../models/Course');

// @desc    Get all enrollments (with filters)
// @route   GET /api/enrollments
// @access  Private
const getEnrollments = async (req, res, next) => {
  try {
    const { courseId, studentId, status } = req.query;
    const query = {};

    if (courseId) query.course = courseId;
    if (studentId) query.student = studentId;
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'studentId name email department year semester section')
      .populate({
        path: 'course',
        select: 'code name semester credits faculty',
        populate: { path: 'faculty', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll single student into course
// @route   POST /api/enrollments
// @access  Private (Admin or Faculty of course)
const enrollStudent = async (req, res, next) => {
  try {
    const { studentId, courseId, semester, academicYear } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ success: false, message: 'Student ID and Course ID are required' });
    }

    // Verify student and course exist
    const [student, course] = await Promise.all([
      Student.findById(studentId),
      Course.findById(courseId),
    ]);

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Check duplicate
    const existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existing) {
      if (existing.status === 'Dropped') {
        existing.status = 'Enrolled';
        await existing.save();
        const reEnrolled = await Enrollment.findById(existing._id)
          .populate('student', 'studentId name email')
          .populate('course', 'code name');
        return res.json({ success: true, data: reEnrolled, message: 'Student re-enrolled in course' });
      }
      return res.status(400).json({ success: false, message: 'Student is already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      semester: semester || course.semester || 5,
      academicYear: academicYear || '2025-2026',
      status: 'Enrolled',
    });

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'studentId name email')
      .populate('course', 'code name');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Student enrolled successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk enroll multiple students into a course
// @route   POST /api/enrollments/bulk
// @access  Private (Admin only)
const bulkEnroll = async (req, res, next) => {
  try {
    const { courseId, studentIds, semester, academicYear } = req.body;

    if (!courseId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Course ID and array of Student IDs required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    let enrolledCount = 0;
    let skippedCount = 0;

    for (const sId of studentIds) {
      try {
        await Enrollment.findOneAndUpdate(
          { student: sId, course: courseId },
          {
            student: sId,
            course: courseId,
            semester: semester || course.semester || 5,
            academicYear: academicYear || '2025-2026',
            status: 'Enrolled',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        enrolledCount++;
      } catch (err) {
        skippedCount++;
      }
    }

    res.json({
      success: true,
      message: `Enrolled ${enrolledCount} students successfully. ${skippedCount > 0 ? `${skippedCount} skipped.` : ''}`,
      enrolledCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or drop enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (Admin only)
const dropEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found' });
    }
    res.json({ success: true, message: 'Enrollment removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEnrollments,
  enrollStudent,
  bulkEnroll,
  dropEnrollment,
};
