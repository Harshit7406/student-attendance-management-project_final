const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Dashboard overview statistics
// @route   GET /api/analytics/overview
// @access  Private
const getOverviewStats = async (req, res, next) => {
  try {
    const [totalStudents, totalCourses, totalFaculty, totalRecords] = await Promise.all([
      Student.countDocuments({ status: 'Active' }),
      Course.countDocuments({ status: 'Active' }),
      User.countDocuments({ role: 'faculty' }),
      Attendance.countDocuments(),
    ]);

    // System-wide overall attendance rate using aggregation
    const overallAgg = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          attended: {
            $sum: {
              $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          attended: 1,
          rate: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ['$attended', '$total'] }, 100] }, 1] },
            ],
          },
        },
      },
    ]);

    const systemAttendanceRate = overallAgg.length > 0 ? overallAgg[0].rate : 0;

    // Today's attendance summary
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const todayAgg = await Attendance.aggregate([
      { $match: { date: today } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const todaySummary = { Present: 0, Absent: 0, Late: 0, Total: 0 };
    todayAgg.forEach((item) => {
      todaySummary[item._id] = item.count;
      todaySummary.Total += item.count;
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalFaculty,
        totalRecords,
        systemAttendanceRate,
        todaySummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// PIPELINE 1: Attendance Percentage by Student
// Demonstrates: $group, $cond, $multiply, $divide, $round, $lookup, $unwind, $project, $sort
// =========================================================================
const getStudentAttendancePercentage = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const matchStage = {};

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      matchStage.course = new mongoose.Types.ObjectId(courseId);
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        // Stage 1: Group attendance records by student
        $group: {
          _id: '$student',
          totalSessions: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
          },
        },
      },
      {
        // Stage 2: Calculate effective present and attendance percentage
        $project: {
          studentId: '$_id',
          totalSessions: 1,
          presentCount: 1,
          lateCount: 1,
          absentCount: 1,
          attendedSessions: { $add: ['$presentCount', '$lateCount'] },
          percentage: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$presentCount', '$lateCount'] },
                      '$totalSessions',
                    ],
                  },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      {
        // Stage 3: Join with students collection
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      {
        // Stage 4: Flatten student array
        $unwind: '$student',
      },
      {
        // Stage 5: Project final formatted fields
        $project: {
          _id: '$student._id',
          studentCode: '$student.studentId',
          name: '$student.name',
          email: '$student.email',
          department: '$student.department',
          semester: '$student.semester',
          section: '$student.section',
          totalSessions: 1,
          presentCount: 1,
          lateCount: 1,
          absentCount: 1,
          attendedSessions: 1,
          percentage: 1,
          isLowAttendance: { $lt: ['$percentage', 75] },
        },
      },
      {
        // Stage 6: Sort by lowest percentage first to highlight students needing intervention
        $sort: { percentage: 1, studentCode: 1 },
      },
    ];

    const results = await Attendance.aggregate(pipeline);

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// PIPELINE 2: Attendance Percentage by Course
// Demonstrates: $group, conditional accumulators, $lookup to courses, $sort
// =========================================================================
const getCourseAttendancePercentage = async (req, res, next) => {
  try {
    const pipeline = [
      {
        // Stage 1: Group attendance by course ID
        $group: {
          _id: '$course',
          totalAttendanceEntries: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
          },
        },
      },
      {
        // Stage 2: Calculate course-wide percentage
        $project: {
          courseId: '$_id',
          totalAttendanceEntries: 1,
          presentCount: 1,
          lateCount: 1,
          absentCount: 1,
          effectivePresent: { $add: ['$presentCount', '$lateCount'] },
          averagePercentage: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$presentCount', '$lateCount'] },
                      '$totalAttendanceEntries',
                    ],
                  },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      {
        // Stage 3: Lookup course information
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      {
        // Stage 4: Unwind course details
        $unwind: '$course',
      },
      {
        // Stage 5: Lookup faculty who teaches the course
        $lookup: {
          from: 'users',
          localField: 'course.faculty',
          foreignField: '_id',
          as: 'faculty',
        },
      },
      {
        $unwind: {
          path: '$faculty',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Stage 6: Project final structure
        $project: {
          _id: '$course._id',
          code: '$course.code',
          name: '$course.name',
          semester: '$course.semester',
          facultyName: '$faculty.name',
          totalAttendanceEntries: 1,
          presentCount: 1,
          lateCount: 1,
          absentCount: 1,
          averagePercentage: 1,
        },
      },
      {
        // Stage 7: Sort by highest course attendance rate
        $sort: { averagePercentage: -1 },
      },
    ];

    const results = await Attendance.aggregate(pipeline);

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// PIPELINE 3: Daily Attendance Totals Grouped by Status
// Demonstrates: $group by date, status breakdown, $dateToString, $sort
// =========================================================================
const getDailyAttendanceTotals = async (req, res, next) => {
  try {
    const { days = 14, courseId } = req.query;
    const matchStage = {};

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      matchStage.course = new mongoose.Types.ObjectId(courseId);
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        // Stage 1: Group by date and calculate totals per status
        $group: {
          _id: '$date',
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      {
        // Stage 2: Format date string and calculate daily percentage
        $project: {
          date: '$_id',
          dateFormatted: { $dateToString: { format: '%Y-%m-%d', date: '$_id' } },
          present: 1,
          late: 1,
          absent: 1,
          total: 1,
          attendanceRate: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $add: ['$present', '$late'] }, '$total'] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      {
        // Stage 3: Sort chronologically ascending
        $sort: { date: 1 },
      },
      {
        // Stage 4: Limit to requested recent days
        $limit: Number(days),
      },
    ];

    const results = await Attendance.aggregate(pipeline);

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// PIPELINE 4: Students Below Configurable Attendance Threshold (Defaulter List)
// Demonstrates: $group, computed percentage, $match on aggregated result, $lookup
// =========================================================================
const getDefaultersList = async (req, res, next) => {
  try {
    const threshold = Number(req.query.threshold) || 75; // Default standard VIT 75%
    const { courseId } = req.query;
    const matchStage = {};

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      matchStage.course = new mongoose.Types.ObjectId(courseId);
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        // Stage 1: Group by student
        $group: {
          _id: '$student',
          totalSessions: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
          },
        },
      },
      {
        // Stage 2: Calculate percentage
        $project: {
          studentId: '$_id',
          totalSessions: 1,
          presentCount: 1,
          lateCount: 1,
          absentCount: 1,
          attendedSessions: { $add: ['$presentCount', '$lateCount'] },
          percentage: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$presentCount', '$lateCount'] },
                      '$totalSessions',
                    ],
                  },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      {
        // Stage 3: MATCH STAGE ON AGGREGATED METRIC (Threshold filter)
        $match: {
          percentage: { $lt: threshold },
        },
      },
      {
        // Stage 4: Lookup student demographic data
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      {
        $unwind: '$student',
      },
      {
        // Stage 5: Project defaulter report
        $project: {
          _id: '$student._id',
          studentCode: '$student.studentId',
          name: '$student.name',
          email: '$student.email',
          department: '$student.department',
          semester: '$student.semester',
          section: '$student.section',
          phone: '$student.phone',
          totalSessions: 1,
          attendedSessions: 1,
          absentCount: 1,
          percentage: 1,
          shortfall: {
            $subtract: [threshold, '$percentage'],
          },
        },
      },
      {
        // Stage 6: Sort by lowest percentage first (most critical defaulters)
        $sort: { percentage: 1 },
      },
    ];

    const results = await Attendance.aggregate(pipeline);

    res.json({
      success: true,
      threshold,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// PIPELINE 5: Monthly Attendance Trends
// Demonstrates: $dateToString, grouping by Year-Month string, trend rate calculation
// =========================================================================
const getMonthlyTrends = async (req, res, next) => {
  try {
    const pipeline = [
      {
        // Stage 1: Group by Month formatted string (YYYY-MM)
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          totalRecords: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
          },
        },
      },
      {
        // Stage 2: Calculate monthly attendance percentage
        $project: {
          month: '$_id',
          totalRecords: 1,
          present: 1,
          late: 1,
          absent: 1,
          attendanceRate: {
            $round: [
              {
                $multiply: [
                  { $divide: [{ $add: ['$present', '$late'] }, '$totalRecords'] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      {
        // Stage 3: Sort chronological order
        $sort: { month: 1 },
      },
    ];

    const results = await Attendance.aggregate(pipeline);

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStats,
  getStudentAttendancePercentage,
  getCourseAttendancePercentage,
  getDailyAttendanceTotals,
  getDefaultersList,
  getMonthlyTrends,
};
