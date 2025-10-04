// routes/invoiceRoutes.js
import express from "express";
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceById,
  exportInvoicesCSV,
  exportInvoicesPDF,
  getInvoiceSummary,
  markInvoicePaid
} from "../controllers/invoiceController.js";

import { validateInvoiceQuery } from "../middleware/validateInvoiceQuery.js";

const router = express.Router();

router.route("/")
  .get(validateInvoiceQuery, getInvoices)   // ✅ with validation
  .post(createInvoice);

router.route("/:id")
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.put("/:id/pay", markInvoicePaid);
router.get("/summary/report", getInvoiceSummary);

router.get("/export/csv", exportInvoicesCSV);
router.get("/export/pdf", exportInvoicesPDF);

export default router;
