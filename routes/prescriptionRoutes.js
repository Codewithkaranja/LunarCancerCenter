import express from "express";
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  dispensePrescriptionTransactional,
  getPrescriptionsByPatient,
  getPrescriptionSummary,
  cancelPrescription,
} from "../controllers/prescriptionController.js";

const router = express.Router();

// ==========================
// PUBLIC ROUTES (no JWT needed)
// ==========================

// Get prescription summary
router.get("/summary", getPrescriptionSummary);

// Get prescriptions by patient
router.get("/patient/:patientId", getPrescriptionsByPatient);

// Get prescription by ID
router.get("/:id", getPrescriptionById);

// Get all prescriptions (optionally filter by status)
router.get("/", getPrescriptions);

// Create new prescription
router.post("/", createPrescription);

// Dispense a prescription
router.put("/:id/dispense", dispensePrescriptionTransactional);

// Cancel a prescription
router.patch("/:id/cancel", cancelPrescription);

export default router;
