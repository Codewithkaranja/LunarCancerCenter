// ==========================
// pharmacyRoutes.js
// ==========================
import express from 'express';
import {
  getAllMedicines,
  getMedicineById,
  dispenseMedicine,
} from '../controllers/pharmacyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================
// Protect all pharmacy routes
// ==========================
router.use(protect);

// ==========================
// Pharmacy Endpoints
// ==========================

// GET all medicines (drugs only)
router.get('/', authorize('admin', 'pharmacist', 'cashier'), getAllMedicines);

// POST dispense medicine (deduct from inventory + log transaction)
router.post('/dispense', authorize('admin', 'pharmacist'), dispenseMedicine);

// GET single medicine by ID
router.get('/:id', authorize('admin', 'pharmacist', 'cashier'), getMedicineById);

export default router;
