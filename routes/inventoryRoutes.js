import express from 'express';
import {
  getAllInventory,
  getInventoryById,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  restockInventoryItem
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// ==========================
// Inventory Routes
// ==========================
router.get('/', getAllInventory); // GET all items
router.post('/', authorize('admin', 'pharmacist'), addInventoryItem); // Add new item
router.get('/:id', getInventoryById); // Get one item
router.put('/:id', authorize('admin', 'pharmacist'), updateInventoryItem); // Update item
router.put('/restock/:id', authorize('admin', 'pharmacist'), restockInventoryItem); // Restock
router.delete('/:id', authorize('admin'), deleteInventoryItem); // Delete item

export default router;
