import express from "express";
import {
  getAllInventory,
  getInventoryById,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem,
  consumeInventoryItem,   // ✅ new
  getInventoryReports,
} from "../controllers/inventoryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// -----------------------------
// Public inventory retrieval (role-limited)
// -----------------------------
router.get("/", authorize("admin", "pharmacist", "cashier"), getAllInventory);
router.get("/reports", authorize("admin", "pharmacist"), getInventoryReports);
router.get("/:id", authorize("admin", "pharmacist", "cashier"), getInventoryById);

// -----------------------------
// Admin / inventory management
// -----------------------------
router.post("/", authorize("admin", "inventory"), addInventoryItem);

// **Important:** custom routes first
router.put("/:id/restock", authorize("admin", "inventory"), restockInventoryItem);
router.put("/:id/consume", authorize("pharmacist"), consumeInventoryItem); // ✅ pharmacist only

// Generic update & delete
router.put("/:id", authorize("admin", "inventory"), updateInventoryItem);
router.delete("/:id", authorize("admin", "inventory"), deleteInventoryItem);

export default router;
