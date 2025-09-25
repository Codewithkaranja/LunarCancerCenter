import express from 'express';
import {
  getSettings,
  updateSettings,
  resetSystem,
  manageUsers
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All settings should be protected + admin only
router.use(protect);
router.use(authorize('admin'));

// Get current system settings
router.get('/', getSettings);

// Update system settings (e.g. hospital name, departments, contact info)
router.put('/', updateSettings);

// Reset or clear system data (⚠️ careful with this)
router.post('/reset', resetSystem);

// Manage user roles (promote, demote, deactivate staff accounts)
router.put('/users/:id', manageUsers);

export default router;
