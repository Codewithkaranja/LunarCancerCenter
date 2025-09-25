import Invoice from "../models/Invoice.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

// ===============================
// @desc    Get all invoices (with search + pagination)
// @route   GET /api/billing
// @access  Protected
// ===============================
export const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = search
      ? {
          $or: [
            { patientName: { $regex: search, $options: "i" } },
            { "services.service": { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const invoices = await Invoice.find(query)
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.json({
      success: true,
      count: invoices.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: invoices,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===============================
// @desc    Export invoices as CSV (flattened by services)
// @route   GET /api/billing/export/csv
// @access  Protected (admin, cashier)
// ===============================
export const exportInvoicesCSV = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email");

    // Flatten each service per invoice
    const flatInvoices = invoices.flatMap(inv =>
      inv.services.map(s => ({
        invoiceNumber: inv.invoiceNumber || "-",
        patientName: inv.patientName,
        patientId: inv.patientId?.patientId || "-",
        status: inv.status,
        discount: inv.discount,
        date: new Date(inv.date).toLocaleDateString(),
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-",
        service: s.service,
        serviceDesc: s.desc,
        qty: s.qty,
        unitPrice: s.unitPrice,
        amount: s.qty * s.unitPrice
      }))
    );

    const fields = [
      "invoiceNumber",
      "patientName",
      "patientId",
      "status",
      "discount",
      "date",
      "dueDate",
      "service",
      "serviceDesc",
      "qty",
      "unitPrice",
      "amount"
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(flatInvoices);

    res.header("Content-Type", "text/csv");
    res.attachment("invoices.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===============================
// @desc    Export invoices as PDF (with services table)
// @route   GET /api/billing/export/pdf
// @access  Protected (admin, cashier)
// ===============================
export const exportInvoicesPDF = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("patientId", "name patientId phone")
      .populate("createdBy", "name role email");

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoices.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Invoices Report", { align: "center" });
    doc.moveDown(2);

    invoices.forEach(inv => {
      doc.fontSize(14).text(`Invoice: ${inv.invoiceNumber || "-"}`);
      doc.fontSize(12).text(`Patient: ${inv.patientName} (${inv.patientId?.patientId || "N/A"})`);
      doc.text(`Status: ${inv.status}`);
      doc.text(`Discount: ${inv.discount}`);
      doc.text(`Date: ${new Date(inv.date).toLocaleDateString()}`);
      doc.text(`Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}`);
      doc.moveDown(0.5);

      if (inv.services.length) {
        doc.text("Services:", { underline: true });
        inv.services.forEach(s => {
          doc.text(
            ` - ${s.service} | ${s.desc || "-"} | Qty: ${s.qty} | Unit: ${s.unitPrice} | Amount: ${s.qty * s.unitPrice}`
          );
        });
      }

      doc.moveDown(2);
      doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
