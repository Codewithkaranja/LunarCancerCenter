// ==========================
// pharmacyRoutes.js (Merged: Pharmacy + Dispense)
// ==========================
import express from "express";
import {
  // Medicines
  getAllMedicines,
  getMedicineById,

  // Dispensing
  createDispense,            // replaces dispenseMedicine
  getAllDispenses,
  getDispensesByPatient,
  getDispensesByMedicine,
  getDispensesByDateRange,
  getDispenseSummary,
  getPatientDispenseSummary,

  // Inventory / Activities
  getPharmacyActivities,
} from "../controllers/pharmacyController.js";   // merged controller
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// -----------------------------
// Middleware
// -----------------------------
router.use(protect);

// -----------------------------
// Medicines
// -----------------------------
router.get("/", authorize("admin", "pharmacist", "cashier"), getAllMedicines);
router.get("/:id", authorize("admin", "pharmacist", "cashier"), getMedicineById);

// -----------------------------
// Dispensing (pharmacist/admin)
// -----------------------------
router.post("/dispense", authorize("admin", "pharmacist"), createDispense);

// Dispense logs
router.get("/dispenses", authorize("admin", "pharmacist"), getAllDispenses);
router.get("/dispenses/patient/:patientId", authorize("admin", "pharmacist"), getDispensesByPatient);
router.get("/dispenses/medicine/:medicineId", authorize("admin", "pharmacist"), getDispensesByMedicine);
router.get("/dispenses/range", authorize("admin", "pharmacist"), getDispensesByDateRange);

// Reports / Summaries
router.get("/summary", authorize("admin", "pharmacist"), getDispenseSummary);
router.get("/summary/patient", authorize("admin", "pharmacist"), getPatientDispenseSummary);

// -----------------------------
// Inventory activities (optional)
// -----------------------------
router.get("/activities", authorize("admin", "pharmacist"), getPharmacyActivities);

export default router;
