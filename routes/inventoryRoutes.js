import express from "express";
import {
  getAllInventory,
  getInventoryById,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem,
} from "../controllers/inventoryController.js";
// import { protect, authorize } from "../middleware/authMiddleware.js"; // remove for now

const router = express.Router();

// ==========================
// Inventory Routes (No auth for testing)
// ==========================

// GET all items
router.get("/", getAllInventory);

// GET single item by ID
router.get("/:id", getInventoryById);

// POST: add new inventory item
router.post("/", addInventoryItem);

// PUT: update/edit item
router.put("/:id", updateInventoryItem);

// PUT: restock item
router.put("/restock/:id", restockInventoryItem);

// DELETE: remove item
router.delete("/:id", deleteInventoryItem);

export default router;
