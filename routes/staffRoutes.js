/*import express from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all staff routes
router.use(protect);

// GET all staff (admin only ideally)
router.get("/", authorize("admin"), getAllStaff);

// GET single staff
router.get("/:id", authorize("admin"), getStaffById);

// CREATE new staff (admin only)
router.post("/", authorize("admin"), createStaff);

// UPDATE staff (admin only)
router.put("/:id", authorize("admin"), updateStaff);

// DELETE staff (admin only)
router.delete("/:id", authorize("admin"), deleteStaff);

export default router;*/

import express from "express";
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import { protect } from "../middleware/authMiddleware.js"; // only use protect for now

const router = express.Router();

// Protect all staff routes
router.use(protect);

// GET all staff (testing: log request)
router.get("/", (req, res, next) => {
  console.log("GET /api/staff hit", req.user); // confirm route hit and user info
  next(); // continue to controller
}, getAllStaff);

// GET single staff
router.get("/:id", (req, res, next) => {
  console.log(`GET /api/staff/${req.params.id} hit`, req.user);
  next();
}, getStaffById);

// CREATE new staff
router.post("/", (req, res, next) => {
  console.log("POST /api/staff hit", req.user, req.body);
  next();
}, createStaff);

// UPDATE staff
router.put("/:id", (req, res, next) => {
  console.log(`PUT /api/staff/${req.params.id} hit`, req.user, req.body);
  next();
}, updateStaff);

// DELETE staff
router.delete("/:id", (req, res, next) => {
  console.log(`DELETE /api/staff/${req.params.id} hit`, req.user);
  next();
}, deleteStaff);

export default router;
