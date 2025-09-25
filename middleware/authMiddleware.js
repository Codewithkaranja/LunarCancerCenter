// middleware/authMiddleware.js

// Dummy authentication middleware
export const protect = (req, res, next) => {
  // In real app, verify JWT or session here
  // For now, let's just simulate a logged-in user
  req.user = {
    id: '12345',
    name: 'Dr. John Doe',
    role: 'admin' // change as needed for testing: 'doctor', 'nurse', etc.
  };
  next();
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};
