// ==========================
// routes/invoiceRoutes.js
// ==========================
import express from "express";
import {
  getInvoicesWithPatientName as getInvoices,       // ✅ new version
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceByIdWithPatientName as getInvoiceById, // ✅ new version
  exportInvoicesCSV,
  exportInvoicesPDF,
  getInvoiceSummary,
  markInvoicePaidFlexible as markInvoicePaid       // ✅ new version
} from "../controllers/invoiceController.js";

import { validateInvoiceQuery } from "../middleware/validateInvoiceQuery.js";

const router = express.Router();

// ==========================
// 📦 Export & Summary Routes
// ==========================
router.get("/export/csv", exportInvoicesCSV);
router.get("/export/pdf", exportInvoicesPDF);
router.get("/summary/report", getInvoiceSummary);

// ==========================
// 🧾 Invoice Collection Routes
// ==========================
router.route("/")
  .get(validateInvoiceQuery, getInvoices) // ✅ Validates query params
  .post(createInvoice);

// ==========================
// 🧠 Single Invoice Operations
// ==========================
router.route("/:id")
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

// ==========================
// 💰 Payment Handling
// ==========================
router.put("/:id/pay", markInvoicePaid); // ✅ Supports both paid/unpaid toggle

export default router;
