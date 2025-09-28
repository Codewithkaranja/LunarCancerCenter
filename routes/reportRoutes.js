// routes/reportRoutes.js
import express from "express";
import {
  getReports,
  getReportById,
  generateReport,
  exportReports,
  exportReportById, // ✅ single report export
} from "../controllers/reportController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 Protect all report routes
//router.use(protect);

// 📊 Get all reports (with filters/pagination)
router.get(
  "/",
  authorize("admin", "nurse", "pharmacist", "cashier", "doctor"),
  getReports
);

// 📌 Get a single report by ID
router.get(
  "/:id",
  authorize("admin", "nurse", "pharmacist", "cashier", "doctor"),
  getReportById
);

// 🆕 Generate a new report
router.post(
  "/",
  authorize("admin", "cashier"),
  generateReport
);

// ⬇️ Export all reports as CSV
router.get(
  "/export",
  authorize("admin", "cashier"),
  exportReports
);

// ⬇️ Export a single report as CSV
router.get(
  "/:id/export",
  authorize("admin", "cashier"),
  exportReportById
);

export default router;
