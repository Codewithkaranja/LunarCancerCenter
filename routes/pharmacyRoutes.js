import express from 'express';
import {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
} from '../controllers/pharmacyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// GET all medicines — accessible by admin, pharmacist, cashier
router.get('/', authorize('admin', 'pharmacist', 'cashier'), getAllMedicines);

// GET single medicine — accessible by admin, pharmacist, cashier
router.get('/:id', authorize('admin', 'pharmacist', 'cashier'), getMedicineById);

// POST new medicine — accessible by admin and pharmacist only
router.post('/', authorize('admin', 'pharmacist'), createMedicine);

// PUT update medicine — accessible by admin and pharmacist only
router.put('/:id', authorize('admin', 'pharmacist'), updateMedicine);

// DELETE medicine — admin only
router.delete('/:id', authorize('admin'), deleteMedicine);

export default router;
