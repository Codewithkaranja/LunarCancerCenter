import express from "express";
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";

const router = express.Router();

/* ============================
   QUERY PARAM VALIDATION
============================ */
const validatePatientQuery = (req, res, next) => {
  let {
    page = 1,
    limit = 5,
    sortDirection = "desc",
    sortColumn = "createdAt",
  } = req.query;

  page = Number(page);
  limit = Number(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 5;

  if (!["asc", "desc"].includes(sortDirection)) sortDirection = "desc";

  // UI column → DB field mapping
  const columnMap = {
    "Patient ID": "patientId",
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

/* ============================
   PATIENT ROUTES
============================ */
router.get("/", validatePatientQuery, getAllPatients);
router.post("/", createPatient);

// Dual-ID support in controller means no changes here
router.get("/:patientId", getPatientById);
router.put("/:patientId", updatePatient);
router.delete("/:patientId", deletePatient);

export default router;
