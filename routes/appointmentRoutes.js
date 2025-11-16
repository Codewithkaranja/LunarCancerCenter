// ================================
// appointmentRoutes.js (Auth-Free Version)
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

const router = express.Router();

// ================================
// 🩺 1. Appointment Routes (No Auth)
// ================================

// GET all appointments
router.get("/", getAllAppointments);

// GET appointments for a specific patient
router.get("/patient/:patientId", getAppointmentsByPatient);

// GET a single appointment by ID
router.get("/:id", getAppointmentById);

// CREATE a new appointment
router.post("/", createAppointment);

// UPDATE an existing appointment
router.put("/:id", updateAppointment);

// DELETE an appointment
router.delete("/:id", deleteAppointment);

export default router;
