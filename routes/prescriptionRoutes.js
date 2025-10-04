// routes/prescriptionRoutes.js
import express from "express";
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  dispensePrescriptionTransactional,
} from "../controllers/prescriptionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// doctors/pharmacists/admin can view (role-limited)
router.get("/", authorize("admin", "pharmacist", "doctor"), getPrescriptions);
router.get("/:id", authorize("admin", "pharmacist", "doctor"), getPrescriptionById);

// create: doctors (or admin)
router.post("/", authorize("admin", "doctor"), createPrescription);

// dispense (transactional): pharmacists/admin
router.put("/:id/dispense", authorize("admin", "pharmacist"), dispensePrescriptionTransactional);

export default router;
