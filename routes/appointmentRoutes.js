// ================================
// appointmentRoutes.js (Auth-Free / Test-Friendly)
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
// 🩺 Appointment Routes (No Auth)
// ================================

// GET all appointments
router.get("/", getAllAppointments);

// GET appointments for a specific patient
// Works with either patientId (PATxxxx) or Mongo _id
router.get("/patient/:patientId", getAppointmentsByPatient);

// GET a single appointment by its Mongo ID
router.get("/:id", getAppointmentById);

// CREATE a new appointment
router.post("/", createAppointment);

// UPDATE an existing appointment
router.put("/:id", updateAppointment);

// DELETE an appointment
router.delete("/:id", deleteAppointment);

export default router;
