import express from "express";
import {
  getReports,
  getReportById,
  generateReport,
  updateReport,
  deleteReport,
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

// Update a report
router.put("/:id", updateReport);

// Delete a report
router.delete("/:id", deleteReport);

// Export all reports as CSV
router.get("/export", exportReports);

// Export single report as CSV
router.get("/:id/export", exportReportById);

export default router;
