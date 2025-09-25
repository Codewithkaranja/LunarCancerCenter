import express from "express";
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
/*import { protect, authorize } from "../middleware/authMiddleware.js";*/

const router = express.Router();
 
// Protect all routes
//router.use(protect);

// Middleware: validate and normalize query params for GET /
const validatePatientQuery = (req, res, next) => {
  let {
    page = 1,
    limit = 5,
    sortDirection = "desc",
    sortColumn = "createdAt",
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 5;
  if (!["asc", "desc"].includes(sortDirection)) sortDirection = "desc";

  // Map frontend columns to DB fields
  const columnMap = {
    "Patient ID": "_id", // ✅ use Mongo's default
    Name: "lastName",
    "Age/Gender": "age",
    Diagnosis: "diagnosis",
    Stage: "stage",
    Doctor: "doctor",
    "Next Appointment": "nextAppointment",
    Status: "status",
  };

  sortColumn = columnMap[sortColumn] || sortColumn;

  req.query.page = page;
  req.query.limit = limit;
  req.query.sortDirection = sortDirection;
  req.query.sortColumn = sortColumn;

  next();
};

// GET all patients (with search, filter, pagination, sorting)
router.get(
  "/",
  /*authorize("admin", "nurse", "doctor", "receptionist", "pharmacist"),*/
  validatePatientQuery,
  getAllPatients
);

// CREATE a new patient
router.post(
  "/",
  /*authorize("admin", "nurse", "doctor", "receptionist", "pharmacist"),*/
  createPatient
);

// GET a single patient by ID
router.get("/:id", getPatientById);

// UPDATE a patient
router.put(
  "/:id",
  /*authorize("admin", "nurse", "doctor", "receptionist", "pharmacist"),*/
  updatePatient
);

// DELETE a patient (admin only)
router.delete("/:id", /*authorize("admin"),*/ deletePatient);

export default router;
