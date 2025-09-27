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

const router = express.Router();

// ======= Test CRUD routes without auth =======
router.route("/")
  .get(getInvoices)         // Get all invoices
  .post(createInvoice);     // Create invoice

router.route("/:id")
  .get(getInvoiceById)      // Get invoice by ID
  .put(updateInvoice)       // Update invoice
  .delete(deleteInvoice);   // Delete invoice

// Export (optional, for testing)
router.get("/export/csv", exportInvoicesCSV);
router.get("/export/pdf", exportInvoicesPDF);

export default router;
