import express from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes (only logged-in users can access)
router.use(protect);

// Routes
router.get('/', getAllAppointments);

// Create appointment (authorized roles only)
router.post(
  '/',
  authorize('admin', 'nurse', 'doctor', 'receptionist', 'pharmacist'),
  createAppointment
);

// Get single appointment
router.get('/:id', getAppointmentById);

// Update appointment (authorized roles)
router.put(
  '/:id',
  authorize('admin', 'nurse', 'doctor', 'receptionist'),
  updateAppointment
);

// Delete appointment (admin only)
router.delete('/:id', authorize('admin'), deleteAppointment);

export default router;
