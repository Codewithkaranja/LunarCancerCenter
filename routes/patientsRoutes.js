// routes/patientRoutes.js
import express from "express";
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
// import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Middleware: validate & normalize query params
const validatePatientQuery = (req, res, next) => {
  let {
    page = 1,
    limit = 5,
    sortDirection = "desc",
    sortColumn = "createdAt",
  } = req.query;

  // normalize numbers
  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 5;
  if (!["asc", "desc"].includes(sortDirection)) sortDirection = "desc";

  // ✅ Map frontend column names to DB fields
  const columnMap = {
    "Patient ID": "patientId", // 🔥 friendly ID
    Name: "lastName",
    "Age/Gender": "age",
    Diagnosis: "diagnosis",
    Stage: "stage",
    Doctor: "doctor",
    "Next Appointment": "nextAppointment",
    Status: "status",
  };

  req.query.page = page;
  req.query.limit = limit;
  req.query.sortDirection = sortDirection;
  req.query.sortColumn = columnMap[sortColumn] || sortColumn;

  next();
};

// =====================
// Patient Routes
// =====================

// GET all patients (with search, filter, pagination, sorting)
router.get("/", validatePatientQuery, getAllPatients);

// CREATE a new patient
router.post("/", createPatient);

// GET a single patient by patientId
router.get("/:patientId", getPatientById);

// UPDATE a patient by patientId
router.put("/:patientId", updatePatient);

// DELETE a patient by patientId
router.delete("/:patientId", deletePatient);

export default router;
