import express from "express";
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  dispensePrescriptionTransactional,
} from "../controllers/prescriptionController.js";

const router = express.Router();

// ✅ TEMPORARILY skip auth for testing
// router.use(protect);

// doctors/pharmacists/admin can view (role-limited)
router.get("/", getPrescriptions);
router.get("/:id", getPrescriptionById);

// create: doctors (or admin)
router.post("/", createPrescription);

// dispense (transactional): pharmacists/admin
router.put("/:id/dispense", dispensePrescriptionTransactional);

export default router;
