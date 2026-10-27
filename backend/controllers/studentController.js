const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');

// @desc    Get all students with search & filtering
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res, next) => {
  try {
    const { search, department, semester, status } = req.query;
    const query = {};

    if (department) {
      query.department = department;
    }
    if (semester) {
      query.semester = Number(semester);
    }
    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { studentId: searchRegex },
        { email: searchRegex },
      ];
    }

    const students = await Student.find(query).sort({ studentId: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student details with enrollment & attendance summary
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Fetch enrollments
    const enrollments = await Enrollment.find({ student: student._id })
      .populate('course', 'code name semester credits')
      .sort({ createdAt: -1 });

    // Fetch total and present attendance
    const attendanceTotal = await Attendance.countDocuments({ student: student._id });
    const attendancePresent = await Attendance.countDocuments({
      student: student._id,
      status: { $in: ['Present', 'Late'] },
    });
    const percentage = attendanceTotal > 0 ? ((attendancePresent / attendanceTotal) * 100).toFixed(1) : '100.0';

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        enrollments,
        stats: {
          totalClasses: attendanceTotal,
          attendedClasses: attendancePresent,
          percentage: Number(percentage),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin only)
const createStudent = async (req, res, next) => {
  try {
    const { studentId, name, email, department, year, semester, section, phone, status } = req.body;

    const existingStudent = await Student.findOne({
      $or: [
        { studentId: studentId.toUpperCase().trim() },
        { email: email.toLowerCase().trim() },
      ],
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'A student with this Student ID or Email already exists',
      });
    }

    const student = await Student.create({
      studentId: studentId.toUpperCase().trim(),
      name,
      email: email.toLowerCase().trim(),
      department: department || 'Computer Science & Engineering',
      year: year || 3,
      semester: semester || 5,
      section: section || 'A',
      phone: phone || '',
      status: status || 'Active',
    });

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin only)
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student & related enrollments and attendance records
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Cascade delete enrollments and attendance
    await Enrollment.deleteMany({ student: student._id });
    await Attendance.deleteMany({ student: student._id });
    await student.deleteOne();

    res.json({
      success: true,
      message: 'Student and associated enrollment/attendance records removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
