import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByPatient,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from "../controllers/appointmentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
//router.use(protect);

// GET all appointments
router.get("/", getAllAppointments);

// GET all appointments for a specific patient — placed BEFORE /:id to avoid conflicts
router.get(
  "/patient/:patientId",
  authorize("admin", "receptionist", "nurse", "doctor"),
  getAppointmentsByPatient
);

// GET single appointment by ID
router.get("/:id", getAppointmentById);

// CREATE new appointment
router.post(
  "/",
  authorize("admin", "receptionist", "nurse", "doctor"),
  createAppointment
);

// UPDATE appointment by ID
router.put(
  "/:id",
  authorize("admin", "receptionist", "nurse", "doctor"),
  updateAppointment
);

// DELETE appointment by ID
router.delete("/:id", authorize("admin"), deleteAppointment);

export default router;
