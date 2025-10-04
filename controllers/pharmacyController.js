// ==========================
// pharmacyController.js (merged: Dispense + Pharmacy + Billing integration)
// ==========================
import Dispense from "../models/Dispense.js";
import Inventory from "../models/Inventory.js";
import Patient from "../models/Patient.js";
import Invoice from "../models/Invoice.js";
import asyncHandler from "express-async-handler";
import { calculateStatus } from "./inventoryController.js"; // reuse stock status helper

// ==========================
// List all medicines (pharmacy view)
// ==========================
export const getAllMedicines = asyncHandler(async (req, res) => {
  const medicines = await Inventory.find({ category: "drug" });
  const data = medicines.map((m) => ({
    ...m.toObject(),
    status: calculateStatus(m),
  }));
  res.json(data);
});

// ==========================
// Get medicine by ID
// ==========================
export const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Inventory.findById(req.params.id);
  if (!medicine || medicine.category !== "drug") {
    res.status(404);
    throw new Error("Medicine not found");
  }
  res.json({ ...medicine.toObject(), status: calculateStatus(medicine) });
});

// ==========================
// Create a dispense (reduces stock, logs dispense, generates invoice)
// ==========================
export const createDispense = asyncHandler(async (req, res) => {
  const { medicineId, quantity: rawQuantity, patientId } = req.body;
  const quantity = Number(rawQuantity);

  if (!medicineId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Invalid medicine or quantity");
  }

  // Find medicine
  const medicine = await Inventory.findById(medicineId);
  if (!medicine || medicine.category !== "drug") {
    res.status(404);
    throw new Error("Medicine not found in inventory");
  }

  // Validate patient if provided
  let patient = null;
  if (patientId) {
    patient = await Patient.findById(patientId);
    if (!patient) {
      res.status(404);
      throw new Error("Patient not found");
    }
  }

  // Check stock
  if (medicine.quantity < quantity) {
    res.status(400);
    throw new Error("Insufficient stock");
  }

  // --- Reduce inventory ---
  medicine.quantity -= quantity;
  medicine.status = calculateStatus(medicine);
  await medicine.save();

  // --- Log dispense ---
  const dispenseLog = await Dispense.create({
    medicineId: medicine._id,
    name: medicine.name,
    quantity,
    dispensedBy: req.user?._id || null,
    patientId: patient ? patient._id : null,
    date: new Date(),
  });

  // --- Create billing invoice ---
  const invoice = await Invoice.create({
    patientId: patient ? patient._id : null,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Walk-in",
    services: [
      {
        service: "Pharmacy Dispense",
        desc: `${quantity} x ${medicine.name}`,
        qty: quantity,
        unitPrice: medicine.sellingPrice,
      },
    ],
    status: "unpaid",
    createdBy: req.user?._id || null,
  });

  res.json({
    message: `${quantity} units of ${medicine.name} dispensed and billed`,
    dispense: dispenseLog,
    invoice,
    medicine,
  });
});

// ==========================
// Helper: attach invoices to dispenses
// ==========================
const attachInvoices = async (logs) => {
  return await Promise.all(
    logs.map(async (log) => {
      const invoice = await Invoice.findOne({ "services.desc": { $regex: log.name, $options: "i" }, patientId: log.patientId });
      return { ...log.toObject(), invoice };
    })
  );
};

// ==========================
// Get all dispenses (with invoices)
// ==========================
export const getAllDispenses = asyncHandler(async (req, res) => {
  const logs = await Dispense.find()
    .populate("medicineId", "name category")
    .populate("patientId", "firstName lastName phone")
    .populate("dispensedBy", "name role")
    .sort({ createdAt: -1 });

  const results = await attachInvoices(logs);
  res.json(results);
});

// ==========================
// Get dispenses by patient (with invoices)
// ==========================
export const getDispensesByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const logs = await Dispense.find({ patientId })
    .populate("medicineId", "name category")
    .populate("dispensedBy", "name role")
    .sort({ createdAt: -1 });

  const results = await attachInvoices(logs);
  res.json(results);
});

// ==========================
// Get dispenses by medicine (with invoices)
// ==========================
export const getDispensesByMedicine = asyncHandler(async (req, res) => {
  const { medicineId } = req.params;
  const logs = await Dispense.find({ medicineId })
    .populate("patientId", "firstName lastName phone")
    .populate("dispensedBy", "name role")
    .sort({ createdAt: -1 });

  const results = await attachInvoices(logs);
  res.json(results);
});

// ==========================
// Get dispenses by date range (with invoices)
// ==========================
export const getDispensesByDateRange = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    res.status(400);
    throw new Error("Start and end dates are required");
  }

  const logs = await Dispense.find({
    date: { $gte: new Date(start), $lte: new Date(end) },
  })
    .populate("medicineId", "name category")
    .populate("patientId", "firstName lastName phone")
    .populate("dispensedBy", "name role")
    .sort({ createdAt: -1 });

  const results = await attachInvoices(logs);
  res.json(results);
});

// ==========================
// Pharmacy / Inventory Activities
// ==========================
export const getPharmacyActivities = asyncHandler(async (req, res) => {
  const activities = await Inventory.find({ category: "drug" }).sort({ updatedAt: -1 });
  const data = activities.map((item) => ({
    id: item._id,
    name: item.name,
    quantity: item.quantity,
    status: calculateStatus(item),
    lastUpdated: item.updatedAt,
  }));
  res.json(data);
});

// ==========================
// Summary / Reporting (with revenue)
// ==========================
export const getDispenseSummary = asyncHandler(async (req, res) => {
  const summary = await Dispense.aggregate([
    {
      $group: {
        _id: "$medicineId",
        totalDispensed: { $sum: "$quantity" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "inventories",
        localField: "_id",
        foreignField: "_id",
        as: "medicine",
      },
    },
    { $unwind: "$medicine" },
    {
      $lookup: {
        from: "invoices",
        localField: "_id",
        foreignField: "services.medicineId",
        as: "invoices",
      },
    },
    {
      $project: {
        medicineName: "$medicine.name",
        category: "$medicine.category",
        totalDispensed: 1,
        count: 1,
        totalRevenue: { $sum: "$invoices.total" },
      },
    },
  ]);

  res.json(summary);
});

// ==========================
// Patient Summary (dispense + billing)
// ==========================
export const getPatientDispenseSummary = asyncHandler(async (req, res) => {
  const summary = await Dispense.aggregate([
    {
      $group: {
        _id: "$patientId",
        totalMedicines: { $sum: "$quantity" },
        dispenseCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "patients",
        localField: "_id",
        foreignField: "_id",
        as: "patient",
      },
    },
    { $unwind: "$patient" },
    {
      $lookup: {
        from: "invoices",
        localField: "_id",
        foreignField: "patientId",
        as: "invoices",
      },
    },
    {
      $project: {
        patientName: { $concat: ["$patient.firstName", " ", "$patient.lastName"] },
        phone: "$patient.phone",
        totalMedicines: 1,
        dispenseCount: 1,
        totalBilled: { $sum: "$invoices.total" },
      },
    },
  ]);

  res.json(summary);
});
