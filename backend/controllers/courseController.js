const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');

// @desc    Get all courses (or filtered by faculty)
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res, next) => {
  try {
    const query = {};

    // If logged in as faculty and 'myCourses' requested, filter to their assigned courses
    if (req.user.role === 'faculty' && req.query.assignedOnly === 'true') {
      query.faculty = req.user._id;
    }

    if (req.query.department) {
      query.department = req.query.department;
    }

    if (req.query.semester) {
      query.semester = Number(req.query.semester);
    }

    const courses = await Course.find(query)
      .populate('faculty', 'name email department')
      .sort({ code: 1 });

    // Also get enrollment counts for each course
    const courseIds = courses.map((c) => c._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, status: 'Enrolled' } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    enrollmentCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const coursesWithCount = courses.map((c) => {
      const obj = c.toObject();
      obj.enrolledCount = countMap[c._id.toString()] || 0;
      return obj;
    });

    res.json({
      success: true,
      count: coursesWithCount.length,
      data: coursesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('faculty', 'name email department');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Get enrolled students
    const enrollments = await Enrollment.find({ course: course._id, status: 'Enrolled' })
      .populate('student', 'studentId name email department year semester section status')
      .sort({ 'student.studentId': 1 });

    res.json({
      success: true,
      data: {
        ...course.toObject(),
        enrolledStudents: enrollments.map((e) => e.student).filter(Boolean),
        enrollmentCount: enrollments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Admin only)
const createCourse = async (req, res, next) => {
  try {
    const { code, name, department, semester, credits, faculty, description } = req.body;

    const existingCourse = await Course.findOne({ code: code.toUpperCase().trim() });
    if (existingCourse) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }

    const course = await Course.create({
      code: code.toUpperCase().trim(),
      name,
      department: department || 'Computer Science & Engineering',
      semester: semester || 5,
      credits: credits || 3,
      faculty,
      description: description || '',
    });

    const populated = await Course.findById(course._id).populate('faculty', 'name email');

    res.status(201).json({
      success: true,
      data: populated,
      message: 'Course created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin only)
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('faculty', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      data: course,
      message: 'Course updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course & cascade delete enrollments and attendance
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    await Enrollment.deleteMany({ course: course._id });
    await Attendance.deleteMany({ course: course._id });
    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course and related enrollments/attendance removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
