// ================================
// inventoryRoutes.js (Auth-Free)
// ================================
import express from "express";
import {
  getAllInventory,
  getInventoryById,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem,
  consumeInventoryItem,
  getInventoryReports,
} from "../controllers/inventoryController.js";

const router = express.Router();

// --------------------------------------------------
// 🚀 ALL ROUTES ARE NOW PUBLIC FOR TESTING
// --------------------------------------------------

// GET all inventory
router.get("/", getAllInventory);

// GET inventory reports
router.get("/reports", getInventoryReports);

// GET single inventory item
router.get("/:id", getInventoryById);

// CREATE new inventory item
router.post("/", addInventoryItem);

// RESTOCK
router.put("/:id/restock", restockInventoryItem);

// CONSUME / DISPENSE
router.put("/:id/consume", consumeInventoryItem);

// UPDATE inventory item
router.put("/:id", updateInventoryItem);

// DELETE inventory item
router.delete("/:id", deleteInventoryItem);

export default router;
