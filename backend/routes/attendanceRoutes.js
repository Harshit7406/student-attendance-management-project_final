const express = require('express');
const router = express.Router();
const {
  getAttendanceSheet,
  recordBatchAttendance,
  getAttendanceHistory,
  updateAttendance,
  deleteAttendance,
  exportAttendanceCSV,
} = require('../controllers/attendanceController');
const { protect, facultyOrAdmin } = require('../middleware/authMiddleware');

router.get('/sheet', protect, facultyOrAdmin, getAttendanceSheet);
router.post('/batch', protect, facultyOrAdmin, recordBatchAttendance);
router.get('/export/csv', protect, exportAttendanceCSV);

router.route('/')
  .get(protect, getAttendanceHistory);

router.route('/:id')
  .put(protect, facultyOrAdmin, updateAttendance)
  .delete(protect, facultyOrAdmin, deleteAttendance);

module.exports = router;
