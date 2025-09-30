// routes/inventoryRoutes.js
import express from "express";
import {
  getAllInventory,
  getInventoryById,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem,
  getPharmacyInventory,
  dispenseInventoryItem,
  getInventoryReports,
} from "../controllers/inventoryController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================
// Apply protection globally
// ==========================
//router.use(protect);

// ==========================
// Inventory Management
// ==========================

// GET all inventory items — Admin, Pharmacist, Cashier
router.get("/", authorize("admin", "pharmacist", "cashier"), getAllInventory);

// POST: add new inventory item — Admin & Pharmacist
router.post("/", authorize("admin", "pharmacist"), addInventoryItem);

// PUT: restock inventory item — Admin & Pharmacist
// Must come BEFORE dynamic /:id route
router.put("/restock/:id", authorize("admin", "pharmacist"), restockInventoryItem);

// ==========================
// Pharmacy Module Integration
// ==========================

// GET inventory for pharmacy module — Admin, Pharmacist, Cashier
router.get("/pharmacy", authorize("admin", "pharmacist", "cashier"), getPharmacyInventory);

// POST: dispense inventory when prescription is filled — Admin & Pharmacist
router.post("/pharmacy/dispense", authorize("admin", "pharmacist"), dispenseInventoryItem);

// ==========================
// Inventory Reports
// ==========================

// GET inventory reports — Admin, Pharmacist, Cashier
router.get("/reports", authorize("admin", "pharmacist", "cashier"), getInventoryReports);

// ==========================
// Dynamic Inventory Item Routes
// ==========================

// PUT: update/edit inventory item by ID — Admin & Pharmacist
router.put("/:id", authorize("admin", "pharmacist"), updateInventoryItem);

// GET: single inventory item by ID — Admin, Pharmacist, Cashier
router.get("/:id", authorize("admin", "pharmacist", "cashier"), getInventoryById);

// DELETE: remove inventory item by ID — Admin only
router.delete("/:id", authorize("admin"), deleteInventoryItem);

export default router;
