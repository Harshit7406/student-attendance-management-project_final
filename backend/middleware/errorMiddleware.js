// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for developers in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error Stack:', err);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    let message = 'Duplicate field value entered.';
    if (err.keyPattern) {
      if (err.keyPattern.student && err.keyPattern.course && err.keyPattern.date) {
        message = 'Attendance has already been recorded for this student in this course on the selected date.';
      } else if (err.keyPattern.student && err.keyPattern.course) {
        message = 'This student is already enrolled in this course.';
      } else if (err.keyPattern.email) {
        message = 'An account/record with this email already exists.';
      } else if (err.keyPattern.studentId) {
        message = 'A student with this Student ID already exists.';
      } else if (err.keyPattern.code) {
        message = 'A course with this course code already exists.';
      }
    }
    return res.status(400).json({ success: false, message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return res.status(400).json({ success: false, message });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Authentication token has expired' });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error. Please try again later.',
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
