import Invoice from "../models/Invoice.js";
import { Parser as Json2CsvParser } from "json2csv";
import PDFDocument from "pdfkit";


// ===============================
// @desc   Get all invoices
// @route  GET /api/billing
// @access Cashier, Admin
// ===============================
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email")
      .lean({ virtuals: true }); // include subtotal, tax, total

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// @desc   Create invoice
// @route  POST /api/billing
// @access Cashier, Admin
// ===============================
export const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    const populated = await invoice
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email");
    res.status(201).json(populated.toJSON({ virtuals: true }));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===============================
// @desc   Update invoice
// @route  PUT /api/billing/:id
// @access Cashier, Admin
// ===============================
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice.toJSON({ virtuals: true }));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ===============================
// @desc   Delete invoice
// @route  DELETE /api/billing/:id
// @access Admin
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
// @desc   Export invoices as CSV
// @route  GET /api/billing/export/csv
// @access Cashier, Admin
// ===============================
export const exportInvoicesCSV = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email")
      .lean({ virtuals: true });

    if (!invoices.length) return res.status(404).json({ message: "No invoices found" });

    const data = invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      patientName: inv.patientName,
      patientId: inv.patientId?.patientId || "",
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
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===============================
// @desc   Export invoices as PDF
// @route  GET /api/billing/export/pdf
// @access Cashier, Admin
// ===============================
// ===============================
// @desc   Get invoice by ID
// @route  GET /api/billing/:id
// @access Cashier, Admin
// ===============================
// ===============================
// @desc   Get invoice by ID
// @route  GET /api/billing/:id
// @access Cashier, Admin
// ===============================
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email")
      .lean({ virtuals: true });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


   // ===============================
// @desc   Export invoices as PDF
// @route  GET /api/billing/export/pdf
// @access Cashier, Admin
// ===============================
export const exportInvoicesPDF = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email")
      .lean({ virtuals: true });

    if (!invoices.length) {
      return res.status(404).json({ message: "No invoices found" });
    }

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Disposition", "attachment; filename=invoices.pdf");
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Invoice Report", { align: "center" }).moveDown();

    invoices.forEach((inv, idx) => {
      doc.fontSize(12)
        .text(`Invoice #: ${inv.invoiceNumber}`)
        .text(`Patient: ${inv.patientName} (${inv.patientId?.patientId || ""})`)
        .text(`Phone: ${inv.patientId?.phone || ""}`)
        .text(`Status: ${inv.status}`)
        .text(`Discount: ${inv.discount}`)
        .text(`Subtotal: ${inv.subtotal}`)
        .text(`Tax: ${inv.tax}`)
        .text(`Total: ${inv.total}`)
        .text(`Created By: ${inv.createdBy?.name || ""}`)
        .text(
          `Date: ${new Date(inv.date).toLocaleDateString()} | Due: ${
            inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : ""
          }`
        )
        .text("Services:");

      inv.services.forEach((s) => {
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
