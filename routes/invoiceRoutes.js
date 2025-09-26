import express from "express";
import { 
  getInvoices, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice, 
  getInvoiceById, 
  exportInvoicesCSV, 
  exportInvoicesPDF 
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// CRUD Routes with dummy auth
router.route("/")
  .get(protect, authorize("admin", "cashier"), getInvoices)
  .post(protect, authorize("admin", "cashier"), createInvoice);

router.route("/:id")
  .get(protect, authorize("admin", "cashier"), getInvoiceById)
  .put(protect, authorize("admin", "cashier"), updateInvoice)
  .delete(protect, authorize("admin"), deleteInvoice);

// Export
router.get("/export/csv", protect, authorize("admin", "cashier"), exportInvoicesCSV);
router.get("/export/pdf", protect, authorize("admin", "cashier"), exportInvoicesPDF);

export default router;
