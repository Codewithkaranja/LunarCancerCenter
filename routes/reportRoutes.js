import express from 'express';
import { getReports, getReportById } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', authorize('admin', 'nurse','pharmacist', 'cashier','nurse', 'doctor'), getReports);
router.get('/:id', getReportById);

export default router;
