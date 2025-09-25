import Invoice from "../models/Invoice.js";
import { Parser as Json2CsvParser } from "json2csv";
import PDFDocument from "pdfkit";
import stream from "stream";

// ===============================
// @desc    Export all invoices as CSV
// @route   GET /api/billing/export/csv
// @access  Admin, Cashier
// ===============================
export const exportInvoicesCSV = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email");

    if (!invoices.length) return res.status(404).json({ message: "No invoices found" });

    const data = invoices.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      patientName: inv.patientName,
      patientId: inv.patientId?.patientId || "",
      phone: inv.patientId?.phone || "",
      status: inv.status,
      discount: inv.discount,
      total: inv.services.reduce((acc, s) => acc + s.qty * s.unitPrice, 0),
      createdBy: inv.createdBy?.name || "",
      date: inv.date.toLocaleDateString(),
      dueDate: inv.dueDate?.toLocaleDateString() || "",
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
// @desc    Export all invoices as PDF
// @route   GET /api/billing/export/pdf
// @access  Admin, Cashier
// ===============================
export const exportInvoicesPDF = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email");

    if (!invoices.length) return res.status(404).json({ message: "No invoices found" });

    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const filename = "invoices.pdf";

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Invoice Report", { align: "center" });
    doc.moveDown();

    invoices.forEach((inv, idx) => {
      doc.fontSize(12).text(`Invoice #: ${inv.invoiceNumber}`);
      doc.text(`Patient: ${inv.patientName} (${inv.patientId?.patientId || ""})`);
      doc.text(`Phone: ${inv.patientId?.phone || ""}`);
      doc.text(`Status: ${inv.status}`);
      doc.text(`Discount: ${inv.discount}`);
      doc.text(`Created By: ${inv.createdBy?.name || ""}`);
      doc.text(`Date: ${inv.date.toLocaleDateString()} | Due: ${inv.dueDate?.toLocaleDateString() || ""}`);
      doc.text("Services:");

      inv.services.forEach(s => {
        doc.text(` - ${s.service}: ${s.qty} x ${s.unitPrice} = ${s.qty * s.unitPrice}`);
      });

      doc.moveDown();
      if (idx < invoices.length - 1) doc.addPage();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
