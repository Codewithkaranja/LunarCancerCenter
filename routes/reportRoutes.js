// routes/reportRoutes.js
import express from "express";
import {
  getReports,
  getReportById,
  generateReport,
  exportReports,
  exportReportById,
} from "../controllers/reportController.js";

const router = express.Router();

// -------------------------
// PUBLIC ROUTES (no auth)
// -------------------------

// Get all reports
router.get("/", getReports);

// Get single report by ID
router.get("/:id", getReportById);

// Generate new report
router.post("/", generateReport);

// Export all reports as CSV
router.get("/export", exportReports);

// Export single report as CSV
router.get("/:id/export", exportReportById);

export default router;
