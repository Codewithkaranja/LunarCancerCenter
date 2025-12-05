// middleware/authMiddleware.js
// ================================
// Simplified Auth Middleware (for appointments only)
// ================================

import jwt from 'jsonwebtoken';
import Staff from '../models/Staff.js';

/**
 * Protect routes – TEMPORARILY allows all appointment routes
 * Can be re-enabled later for full JWT verification
 */
export const protect = async (req, res, next) => {
  // For now, appointments are open — do not block
  // You can add JWT checks later when you want to protect routes
  return next();
};

/**
 * Role-based access control – TEMPORARY
 * Currently allows all roles for appointments
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // No role restrictions for now
    return next();
  };
};

/**
 * Optional: Placeholder functions for future JWT logic
 * You can uncomment and reuse later for protecting routes
 */
/*
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await Staff.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (err) {
      console.error('JWT error:', err.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};*/
