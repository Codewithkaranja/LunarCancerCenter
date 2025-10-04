import express from "express";
import {
  getLabReports,
  createLabReport,
  getLabReportById,
  updateLabReport,
  deleteLabReport,
} from "../controllers/labReportController.js";

const router = express.Router();

// Base: /api/labreports
router.route("/")
  .get(getLabReports)       // Get all lab reports
  .post(createLabReport);   // Create new lab report

router.route("/:id")
  .get(getLabReportById)    // Get lab report by ID
  .put(updateLabReport)     // Update lab report
  .delete(deleteLabReport); // Delete lab report

export default router;
