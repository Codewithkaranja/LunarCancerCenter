// ================================
// appointmentRoutes.js
// ================================
import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  getAppointmentsByPatient,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controllers/appointmentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===================================
// 🔐 1. Global Authentication Middleware
// Ensures all appointment routes require a valid JWT
// ===================================
router.use(protect);

// ===================================
// 🩺 2. Appointment Routes
// ===================================

// GET all appointments (visible to clinical & admin roles)
router.get(
  "/",
  authorize("admin", "receptionist", "nurse", "doctor"),
  getAllAppointments
);

// GET appointments for a specific patient
router.get(
  "/patient/:patientId",
  authorize("admin", "receptionist", "nurse", "doctor"),
  getAppointmentsByPatient
);

// GET a single appointment by ID
router.get(
  "/:id",
  authorize("admin", "receptionist", "nurse", "doctor"),
  getAppointmentById
);

// CREATE a new appointment
router.post(
  "/",
  authorize("admin", "receptionist", "nurse", "doctor"),
  createAppointment
);

// UPDATE an existing appointment
router.put(
  "/:id",
  authorize("admin", "receptionist", "nurse", "doctor"),
  updateAppointment
);

// DELETE appointment (🔒 admin only)
router.delete("/:id", authorize("admin"), deleteAppointment);

export default router;
