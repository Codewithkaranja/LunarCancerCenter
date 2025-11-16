import express from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import { protect } from "../middleware/authMiddleware.js"; 
// import { authorize } from "../middleware/authMiddleware.js"; // enable later

const router = express.Router();

// ===== Permanent Health/Test Endpoint =====
router.get("/health", async (req, res) => {
  try {
    res.status(200).json({ status: "ok", message: "Staff API is reachable ✅" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({ status: "error", message: "Staff API health check failed ❌" });
  }
});

// ===== GET all staff =====
// Optional query params: ?role=doctor&department=Cardiology
router.get("/", (req, res, next) => {
  console.log("GET /api/staff hit", req.user, "query:", req.query);
  next();
}, getAllStaff);

// ===== GET single staff =====
// Optional query param: ?populate=appointments,prescriptions
router.get("/:id", (req, res, next) => {
  console.log(`GET /api/staff/${req.params.id} hit`, req.user, "query:", req.query);
  next();
}, getStaffById);

// ===== CREATE new staff =====
router.post("/", (req, res, next) => {
  console.log("POST /api/staff hit", req.user, req.body);
  next();
}, createStaff);

// ===== UPDATE staff =====
router.put("/:id", (req, res, next) => {
  console.log(`PUT /api/staff/${req.params.id} hit`, req.user, req.body);
  next();
}, updateStaff);

// ===== DELETE staff =====
router.delete("/:id", (req, res, next) => {
  console.log(`DELETE /api/staff/${req.params.id} hit`, req.user);
  next();
}, deleteStaff);

export default router;
