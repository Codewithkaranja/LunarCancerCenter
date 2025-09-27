import Invoice from "../models/Invoice.js";
import { Parser as Json2CsvParser } from "json2csv";
import PDFDocument from "pdfkit";

// ===============================
// Get all invoices
// ===============================
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate([
        { path: "patientId", select: "firstName lastName phone" },
        { path: "createdBy", select: "name role email" },
      ])
      .lean({ virtuals: true });

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// Create a new invoice
// ===============================
export const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();

    // Populate single document safely (do NOT use lean here)
    await invoice.populate([
      { path: "patientId", select: "firstName lastName phone" },
      { path: "createdBy", select: "name role email" },
    ]);

    res.status(201).json(invoice.toJSON({ virtuals: true }));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===============================
// Update invoice by ID
// ===============================
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    Object.assign(invoice, req.body);
    await invoice.save();

    await invoice.populate([
      { path: "patientId", select: "firstName lastName phone" },
      { path: "createdBy", select: "name role email" },
    ]);

    res.json(invoice.toJSON({ virtuals: true }));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===============================
// Delete invoice
// ===============================
export const deleteInvoice = async (req, res) => {
  try {
    const deleted = await Invoice.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Invoice not found" });

    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// Get invoice by ID
// ===============================
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    await invoice.populate([
      { path: "patientId", select: "firstName lastName phone" },
      { path: "createdBy", select: "name role email" },
    ]);

    res.json(invoice.toJSON({ virtuals: true }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// Export invoices as CSV
// ===============================
export const exportInvoicesCSV = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate([
        { path: "patientId", select: "firstName lastName phone" },
        { path: "createdBy", select: "name role email" },
      ])
      .lean({ virtuals: true });

    if (!invoices.length)
      return res.status(404).json({ message: "No invoices found" });

    const data = invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      patientName: inv.patientName,
      patientId: inv.patientId?._id || "",
      phone: inv.patientId?.phone || "",
      status: inv.status,
      discount: inv.discount,
      subtotal: inv.subtotal,
      tax: inv.tax,
      total: inv.total,
      createdBy: inv.createdBy?.name || "",
      date: new Date(inv.date).toLocaleDateString(),
      dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "",
    }));

    const parser = new Json2CsvParser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("invoices.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// Export invoices as PDF
// ===============================
export const exportInvoicesPDF = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate([
        { path: "patientId", select: "firstName lastName phone" },
        { path: "createdBy", select: "name role email" },
      ])
      .lean({ virtuals: true });

    if (!invoices.length)
      return res.status(404).json({ message: "No invoices found" });

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Disposition", "attachment; filename=invoices.pdf");
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    invoices.forEach((inv, idx) => {
      doc.fontSize(12)
        .text(`Invoice #: ${inv.invoiceNumber}`)
        .text(`Patient: ${inv.patientName} (${inv.patientId?._id || ""})`)
        .text(`Phone: ${inv.patientId?.phone || ""}`)
        .text(`Status: ${inv.status}`)
        .text(`Discount: ${inv.discount}`)
        .text(`Subtotal: ${inv.subtotal}`)
        .text(`Tax: ${inv.tax}`)
        .text(`Total: ${inv.total}`)
        .text(`Created By: ${inv.createdBy?.name || ""}`)
        .text(`Date: ${new Date(inv.date).toLocaleDateString()} | Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ""}`)
        .text("Services:");

      inv.services.forEach(s => {
        doc.text(` - ${s.service}: ${s.qty} x ${s.unitPrice} = ${s.qty * s.unitPrice}`);
      });

      if (idx < invoices.length - 1) doc.addPage();
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
