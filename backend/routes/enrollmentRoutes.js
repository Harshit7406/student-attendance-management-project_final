const express = require('express');
const router = express.Router();
const {
  getEnrollments,
  enrollStudent,
  bulkEnroll,
  dropEnrollment,
} = require('../controllers/enrollmentController');
const { protect, adminOnly, facultyOrAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEnrollments)
  .post(protect, facultyOrAdmin, enrollStudent);

router.post('/bulk', protect, adminOnly, bulkEnroll);
router.delete('/:id', protect, adminOnly, dropEnrollment);

module.exports = router;
