const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');

// Helper to normalize date to UTC midnight
const normalizeDate = (d) => {
  const dateObj = new Date(d);
  dateObj.setUTCHours(0, 0, 0, 0);
  return dateObj;
};

// @desc    Get attendance sheet for a course and date (for taking attendance UI)
// @route   GET /api/attendance/sheet
// @access  Private (Faculty or Admin)
const getAttendanceSheet = async (req, res, next) => {
  try {
    const { courseId, date } = req.query;

    if (!courseId || !date) {
      return res.status(400).json({ success: false, message: 'courseId and date are required query parameters' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Role check: if faculty, verify assignment
    if (req.user.role === 'faculty' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to manage attendance for this course' });
    }

    const targetDate = normalizeDate(date);

    // 1. Get all enrolled students in the course
    const enrollments = await Enrollment.find({ course: courseId, status: 'Enrolled' })
      .populate('student', 'studentId name email section')
      .sort({ 'student.studentId': 1 });

    // 2. Get existing attendance records for this course on this date
    const existingRecords = await Attendance.find({
      course: courseId,
      date: targetDate,
    });

    const recordMap = {};
    existingRecords.forEach((r) => {
      recordMap[r.student.toString()] = {
        _id: r._id,
        status: r.status,
        remarks: r.remarks,
      };
    });

    // 3. Assemble sheet rows
    const sheet = enrollments
      .filter((e) => e.student) // Guard against any dangling references
      .map((e) => {
        const s = e.student;
        const existing = recordMap[s._id.toString()];
        return {
          studentId: s._id,
          registrationNo: s.studentId,
          name: s.name,
          email: s.email,
          section: s.section,
          status: existing ? existing.status : 'Present', // default to Present
          remarks: existing ? existing.remarks : '',
          isRecorded: !!existing,
          attendanceId: existing ? existing._id : null,
        };
      });

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          code: course.code,
          name: course.name,
        },
        date: targetDate,
        totalEnrolled: sheet.length,
        alreadyRecorded: existingRecords.length > 0,
        records: sheet,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record or batch save attendance for a course on a date
// @route   POST /api/attendance/batch
// @access  Private (Faculty or Admin)
const recordBatchAttendance = async (req, res, next) => {
  try {
    const { courseId, date, records } = req.body;

    if (!courseId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'courseId, date, and records array are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Role check: if faculty, verify assignment
    if (req.user.role === 'faculty' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to manage attendance for this course' });
    }

    const targetDate = normalizeDate(date);
    const facultyId = req.user._id;

    const operations = records.map((rec) => {
      return {
        updateOne: {
          filter: {
            student: rec.studentId,
            course: courseId,
            date: targetDate,
          },
          update: {
            $set: {
              student: rec.studentId,
              course: courseId,
              faculty: facultyId,
              date: targetDate,
              status: rec.status,
              remarks: rec.remarks || '',
            },
          },
          upsert: true,
        },
      };
    });

    const result = await Attendance.bulkWrite(operations);

    res.json({
      success: true,
      message: `Attendance saved successfully: ${result.upsertedCount} recorded, ${result.modifiedCount} updated.`,
      result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance history with flexible filtering
// @route   GET /api/attendance
// @access  Private
const getAttendanceHistory = async (req, res, next) => {
  try {
    const { courseId, studentId, status, startDate, endDate } = req.query;
    const query = {};

    if (courseId) query.course = courseId;
    if (studentId) query.student = studentId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = normalizeDate(endDate);
        // set to end of that day
        end.setUTCHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // If faculty, optionally constrain or allow all if assigned
    if (req.user.role === 'faculty' && req.query.assignedOnly === 'true') {
      const myCourses = await Course.find({ faculty: req.user._id }).select('_id');
      query.course = { $in: myCourses.map((c) => c._id) };
    }

    const records = await Attendance.find(query)
      .populate('student', 'studentId name email department')
      .populate('course', 'code name semester')
      .populate('faculty', 'name email')
      .sort({ date: -1, 'student.studentId': 1 })
      .limit(500);

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update single attendance entry (correct record)
// @route   PUT /api/attendance/:id
// @access  Private (Faculty or Admin)
const updateAttendance = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    const record = await Attendance.findById(req.params.id).populate('course');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (req.user.role === 'faculty' && record.course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit attendance for this course' });
    }

    if (status) record.status = status;
    if (remarks !== undefined) record.remarks = remarks;

    await record.save();

    const updated = await Attendance.findById(record._id)
      .populate('student', 'studentId name email')
      .populate('course', 'code name')
      .populate('faculty', 'name email');

    res.json({
      success: true,
      data: updated,
      message: 'Attendance record corrected successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Faculty or Admin)
const deleteAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id).populate('course');
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (req.user.role === 'faculty' && record.course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete attendance for this course' });
    }

    await record.deleteOne();

    res.json({ success: true, message: 'Attendance record removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Export attendance to CSV
// @route   GET /api/attendance/export/csv
// @access  Private
const exportAttendanceCSV = async (req, res, next) => {
  try {
    const { courseId, studentId, status, startDate, endDate } = req.query;
    const query = {};

    if (courseId) query.course = courseId;
    if (studentId) query.student = studentId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = normalizeDate(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const records = await Attendance.find(query)
      .populate('student', 'studentId name email department')
      .populate('course', 'code name')
      .populate('faculty', 'name')
      .sort({ date: -1 });

    // Build CSV string
    const headers = ['Date', 'Student ID', 'Student Name', 'Course Code', 'Course Name', 'Status', 'Faculty', 'Remarks'];
    const rows = records.map((r) => {
      const dateStr = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
      const sId = r.student ? r.student.studentId : 'N/A';
      const sName = r.student ? `"${r.student.name.replace(/"/g, '""')}"` : 'N/A';
      const cCode = r.course ? r.course.code : 'N/A';
      const cName = r.course ? `"${r.course.name.replace(/"/g, '""')}"` : 'N/A';
      const stat = r.status;
      const fac = r.faculty ? `"${r.faculty.name.replace(/"/g, '""')}"` : 'N/A';
      const rem = r.remarks ? `"${r.remarks.replace(/"/g, '""')}"` : '""';

      return [dateStr, sId, sName, cCode, cName, stat, fac, rem].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceSheet,
  recordBatchAttendance,
  getAttendanceHistory,
  updateAttendance,
  deleteAttendance,
  exportAttendanceCSV,
};
