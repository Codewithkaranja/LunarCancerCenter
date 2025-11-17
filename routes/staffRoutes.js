import express from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import Staff from "../models/Staff.js";

const router = express.Router();

/* ============================
   HEALTH CHECK
============================ */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Staff API is reachable ✅" });
});

/* ============================
   GET ONLY DOCTORS
============================ */
// For patient dropdowns
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await Staff.find({ role: "doctor" })
      .select("_id firstName lastName specialty department")
      .sort({ lastName: 1, firstName: 1 }); // alphabetic

    res.status(200).json({ success: true, doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================
   CRUD ROUTES
============================ */
router.get("/", getAllStaff);
router.get("/:id", getStaffById);
router.post("/", createStaff);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;
