import Report from "../models/Report.js";
import Invoice from "../models/Invoice.js";
import Patient from "../models/Patient.js";
import User from "../models/Staff.js";
import Dispense from "../models/Dispense.js";
import { Parser as Json2CsvParser } from "json2csv";

// =========================
// @desc   Fetch reports with filters, sorting, pagination
// @route  GET /api/reports
// =========================
export const getReports = async (req, res) => {
  try {
    const {
      category,
      dateRange,
      author,
      sortField = "generatedAt",
      sortDirection = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};
    if (category) query.type = category;
    if (dateRange) query.dateRange = { $regex: dateRange, $options: "i" };
    if (author) query.author = author;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(query)
      .populate("author", "name email role")
      .sort({ [sortField]: sortDirection === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Report.countDocuments(query);

    const formattedReports = reports.map(r => ({
      id: r._id.toString(),
      name: r.name,
      type: r.type,
      dateRange: r.dateRange,
      generatedAt: r.generatedAt,
      author: r.author?.name || "Unknown",
      snapshot: r.snapshot,
      relatedRecords: r.relatedRecords,
    }));

    res.json({ reports: formattedReports, totalCount });
  } catch (err) {
    console.error("❌ getReports error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =========================
// @desc   Generate new report
// @route  POST /api/reports
// =========================
export const generateReport = async (req, res) => {
  try {
    const { name, type, dateRange } = req.body;
    if (!name || !type) return res.status(400).json({ message: "Name and type are required" });

    let snapshot = { summary: {}, details: [] };

    if (type === "billing") {
      const invoices = await Invoice.find().populate("patientId", "name");
      const total = invoices.reduce((s, i) => s + (i.amount || 0), 0);
      const paid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);

      snapshot.summary = { totalInvoices: invoices.length, total, paid, pending: total - paid };
      snapshot.details = invoices.map(i => ({
        id: i._id.toString(),
        patient: i.patientId?.name || "Unknown",
        amount: i.amount || 0,
        status: i.status,
      }));
    }

    if (type === "patient") {
      const patients = await Patient.find();
      snapshot.summary = { totalPatients: patients.length };
      snapshot.details = patients.map(p => ({ id: p._id.toString(), name: p.name, age: p.age }));
    }

    if (type === "staff") {
      const users = await User.find();
      snapshot.summary = { totalStaff: users.length };
      snapshot.details = users.map(u => ({ id: u._id.toString(), name: u.name, role: u.role }));
    }

    if (type === "dispense") {
      const dispenses = await Dispense.find().populate("dispensedBy", "name role");
      const totalUnits = dispenses.reduce((s, d) => s + (d.quantity || 0), 0);
      const uniqueMeds = new Set(dispenses.map(d => d.name)).size;

      snapshot.summary = { totalTransactions: dispenses.length, totalUnits, uniqueMedicines: uniqueMeds };
      snapshot.details = dispenses.map(d => ({
        id: d._id.toString(),
        medicine: d.name,
        quantity: d.quantity,
        patientId: d.patientId || "N/A",
        dispensedBy: d.dispensedBy?.name || "Unknown",
        role: d.dispensedBy?.role || "N/A",
        date: d.date.toISOString().slice(0, 10),
      }));
    }

    const tempAuthorId = "64d9f1a2b3c4d5e6f7a8b9c0"; // Replace with real Staff _id

    const report = await Report.create({ name, type, dateRange, author: tempAuthorId, snapshot });
    await report.populate("author", "name email role");

    res.status(201).json({
      id: report._id.toString(),
      name: report.name,
      type: report.type,
      dateRange: report.dateRange,
      generatedAt: report.generatedAt,
      author: report.author?.name || "Unknown",
      snapshot: report.snapshot,
      relatedRecords: report.relatedRecords,
    });
  } catch (err) {
    console.error("❌ generateReport error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =========================
// @desc   Get single report
// @route  GET /api/reports/:id
// =========================
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate("author", "name email role");
    if (!report) return res.status(404).json({ message: "Report not found" });

    res.json({
      id: report._id.toString(),
      name: report.name,
      type: report.type,
      dateRange: report.dateRange,
      generatedAt: report.generatedAt,
      author: report.author?.name || "Unknown",
      snapshot: report.snapshot,
      relatedRecords: report.relatedRecords,
    });
  } catch (err) {
    console.error("❌ getReportById error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =========================
// @desc   Update a report
// @route  PUT /api/reports/:id
// =========================
export const updateReport = async (req, res) => {
  try {
    const { name, type, dateRange } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { name, type, dateRange },
      { new: true }
    ).populate("author", "name email role");

    if (!report) return res.status(404).json({ message: "Report not found" });

    res.json({
      id: report._id.toString(),
      name: report.name,
      type: report.type,
      dateRange: report.dateRange,
      generatedAt: report.generatedAt,
      author: report.author?.name || "Unknown",
      snapshot: report.snapshot,
      relatedRecords: report.relatedRecords,
    });
  } catch (err) {
    console.error("❌ updateReport error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =========================
// @desc   Delete a report
// @route  DELETE /api/reports/:id
// =========================
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("❌ deleteReport error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =========================
// @desc   Export all reports CSV
// @route  GET /api/reports/export
// =========================
export const exportReports = async (req, res) => {
  try {
    const { category, dateRange } = req.query;
    const query = {};
    if (category) query.type = category;
    if (dateRange) query.dateRange = { $regex: dateRange, $options: "i" };

    const reports = await Report.find(query).populate("author", "name email");
    const normalizedReports = reports.map(r => ({
      id: r._id.toString(),
      name: r.name,
      type: r.type,
      dateRange: r.dateRange,
      generatedAt: r.generatedAt,
      author: r.author?.name || "Unknown",
    }));

    const fields = ["id", "name", "type", "dateRange", "author", "generatedAt"];
    const parser = new Json2CsvParser({ fields });
    const csv = parser.parse(normalizedReports);

    res.header("Content-Type", "text/csv");
    res.attachment(`${category || "reports"}_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (err) {
    console.error("❌ exportReports error:", err);
    res.status(500).json({ message: "Failed to export reports" });
  }
};

// =========================
// @desc   Export single report CSV
// @route  GET /api/reports/:id/export
// =========================
export const exportReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate("author", "name email");
    if (!report) return res.status(404).json({ message: "Report not found" });

    const meta = {
      id: report._id.toString(),
      name: report.name,
      type: report.type,
      dateRange: report.dateRange || "N/A",
      generatedAt: report.generatedAt.toISOString(),
      author: report.author?.name || "Unknown",
    };

    const summaryCsv = report.snapshot?.summary
      ? new Json2CsvParser({ fields: Object.keys(report.snapshot.summary) }).parse([report.snapshot.summary])
      : "No summary available";

    const detailsCsv =
      Array.isArray(report.snapshot?.details) && report.snapshot.details.length > 0
        ? new Json2CsvParser({ fields: Object.keys(report.snapshot.details[0]) }).parse(report.snapshot.details)
        : "No details available";

    let finalCsv = "=== Report Metadata ===\n";
    finalCsv += Object.entries(meta).map(([k, v]) => `${k},${v}`).join("\n");
    finalCsv += "\n\n=== Report Summary ===\n" + summaryCsv;
    finalCsv += "\n\n=== Report Details ===\n" + detailsCsv;

    const safeName = report.name.replace(/\s+/g, "_").replace(/[^\w\-]/g, "");
    res.header("Content-Type", "text/csv");
    res.attachment(`${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(finalCsv);
  } catch (err) {
    console.error("❌ exportReportById error:", err);
    res.status(500).json({ message: "Failed to export report" });
  }
};
