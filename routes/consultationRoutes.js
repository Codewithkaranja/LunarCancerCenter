import express from "express";
import {
  getConsultations,
  createConsultation,
  getConsultationById,
  updateConsultation,
  deleteConsultation,
} from "../controllers/consultationController.js";

const router = express.Router();

// Base: /api/consultations
router.route("/")
  .get(getConsultations)       // Get all consultations
  .post(createConsultation);   // Create new consultation

router.route("/:id")
  .get(getConsultationById)    // Get consultation by ID
  .put(updateConsultation)     // Update consultation
  .delete(deleteConsultation); // Delete consultation

export default router;
