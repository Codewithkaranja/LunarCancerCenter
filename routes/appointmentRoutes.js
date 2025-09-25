import express from "express";
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
} from "../controllers/appointmentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllAppointments);
router.post("/", authorize("admin", "receptionist", "nurse", "doctor"), createAppointment);
router.get("/:id", getAppointmentById);
router.put("/:id", authorize("admin", "receptionist", "nurse", "doctor"), updateAppointment);
router.delete("/:id", authorize("admin"), deleteAppointment);

export default router;
