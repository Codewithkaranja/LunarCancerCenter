import express from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import Staff from "../models/Staff.js"; // Required for /doctors endpoint

const router = express.Router();

/* ============================
   STAFF ROUTES
============================ */

// ===== Health Check =====
router.get("/health", async (req, res) => {
  try {
    res.status(200).json({ status: "ok", message: "Staff API is reachable ✅" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ status: "error", message: "Staff API health check failed ❌" });
  }
});

// ===== GET only doctors =====
// Used by Patient Module for doctor dropdown
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await Staff.find({ role: "doctor" })
      .select("_id firstName lastName specialty department");

    res.status(200).json({ success: true, doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================
   CRUD ROUTES
============================ */

// GET all staff
router.get("/", getAllStaff);

// GET single staff
router.get("/:id", getStaffById);

// CREATE staff
router.post("/", createStaff);

// UPDATE staff
router.put("/:id", updateStaff);

// DELETE staff
router.delete("/:id", deleteStaff);

export default router;
