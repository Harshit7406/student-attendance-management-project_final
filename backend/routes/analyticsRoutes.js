const express = require('express');
const router = express.Router();
const {
  getOverviewStats,
  getStudentAttendancePercentage,
  getCourseAttendancePercentage,
  getDailyAttendanceTotals,
  getDefaultersList,
  getMonthlyTrends,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/overview', protect, getOverviewStats);
router.get('/students', protect, getStudentAttendancePercentage);
router.get('/courses', protect, getCourseAttendancePercentage);
router.get('/daily', protect, getDailyAttendanceTotals);
router.get('/defaulters', protect, getDefaultersList);
router.get('/monthly', protect, getMonthlyTrends);

module.exports = router;
