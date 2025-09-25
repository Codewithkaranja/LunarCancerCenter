import express from 'express'; 
import {
  getAllPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription
} from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// View all prescriptions (doctor, admin, pharmacist, cashier)
router.get('/', getAllPrescriptions);

// Create prescription (draft or submit)
router.post('/', authorize('doctor', 'admin'), createPrescription);

// View single prescription
router.get('/:id', getPrescriptionById);

// Update prescription (edit draft, status, or dispense)
router.put('/:id', authorize('doctor', 'admin', 'pharmacist'), updatePrescription);

// Cancel prescription (admin only)
router.delete('/:id', authorize('admin'), deletePrescription);

export default router;
