import express from "express";
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  deletePrescription,
  dispensePrescriptionTransactional,
  getPrescriptionsByPatient,
  getPrescriptionSummary,
  cancelPrescription,
} from "../controllers/prescriptionController.js";

const router = express.Router();

// ==========================
// PRESCRIPTION ROUTES
// ==========================

// Get prescription summary
router.get("/summary", getPrescriptionSummary);

// Get prescriptions by patient
router.get("/patient/:patientId", getPrescriptionsByPatient);

// Get single prescription by ID
router.get("/:id", getPrescriptionById);

// Get all prescriptions (optional status filter)
router.get("/", getPrescriptions);

// Create new prescription
router.post("/", createPrescription);

// Update a prescription
router.put("/:id", updatePrescription);

// Delete a prescription
router.delete("/:id", deletePrescription);

// Dispense a prescription (transactional)
router.put("/:id/dispense", dispensePrescriptionTransactional);

// Cancel a prescription
router.patch("/:id/cancel", cancelPrescription);

export default router;
