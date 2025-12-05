// ================================
// appointmentRoutes.js (TEMP: No Auth, Appointments Open)
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

import { protect, authorize } from "../middleware/authMiddleware.js"; // TEMP middleware

const router = express.Router();

// Public GET routes
router.get("/", getAllAppointments);
router.get("/patient/:patientId", getAppointmentsByPatient);
router.get("/:id", getAppointmentById);

// Public CREATE/UPDATE/DELETE (middleware allows all for now)
router.post("/", protect, createAppointment);
router.put("/:id", protect, updateAppointment);
router.delete("/:id", protect, deleteAppointment);

export default router;
