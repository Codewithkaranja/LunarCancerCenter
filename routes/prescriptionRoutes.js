// routes/prescriptionRoutes.js
import express from 'express';
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController.js';
// import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * ================================
 * Prescription Routes
 * ================================
 * GET    /api/prescriptions       -> Get all prescriptions
 * POST   /api/prescriptions       -> Create prescription
 * GET    /api/prescriptions/:id   -> Get single prescription
 * PUT    /api/prescriptions/:id   -> Update prescription (edit, reissue, dispense)
 * DELETE /api/prescriptions/:id   -> Cancel prescription
 */

// 🔐 Enable auth middleware later
// router.use(protect);

// View all prescriptions (doctor, admin, pharmacist, cashier)
router.get('/', getAllPrescriptions);

// Create prescription (draft or submit)
// router.post('/', authorize('doctor', 'admin'), createPrescription);
router.post('/', createPrescription); // auth disabled for now

// View single prescription
router.get('/:id', getPrescriptionById);

// Update prescription (edit, status update, dispense)
// router.put('/:id', authorize('doctor', 'admin', 'pharmacist'), updatePrescription);
router.put('/:id', updatePrescription); // auth disabled for now

// Cancel prescription (admin only)
// router.delete('/:id', authorize('admin'), deletePrescription);
router.delete('/:id', deletePrescription); // auth disabled for now

export default router;
