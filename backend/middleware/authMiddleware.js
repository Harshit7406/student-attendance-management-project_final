const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes: verify JWT Bearer token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretjwtkey_bcse302p_labreview3_vit'
      );

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' });
      }

      if (req.user.status === 'inactive') {
        return res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact administrator.' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized: token is invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized: no token provided' });
  }
};

// Authorize roles: Admin only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access forbidden: Admin privilege required',
  });
};

// Authorize roles: Faculty or Admin
const facultyOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'faculty')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access forbidden: Faculty or Admin privilege required',
  });
};

module.exports = {
  protect,
  adminOnly,
  facultyOrAdmin,
};
