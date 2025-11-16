// controllers/prescriptionController.js
import Prescription from "../models/Prescription.js";
import Inventory from "../models/Inventory.js";
import Dispense from "../models/Dispense.js";
import Patient from "../models/Patient.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { calculateStatus } from "./inventoryController.js";
import Invoice from "../models/Invoice.js";

// ==========================
// GET /api/prescriptions?status=draft|submitted|dispensed|cancelled
// ==========================
export const getPrescriptions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const prescriptions = await Prescription.find(filter)
    .populate("patientId", "firstName lastName phone")
    .populate("doctorId", "name specialization")
    .sort({ createdAt: -1 });

  res.json(prescriptions);
});

// ==========================
// GET /api/prescriptions/:id
// ==========================
export const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate("patientId", "firstName lastName phone")
    .populate("doctorId", "name specialization");

  if (!prescription) {
    res.status(404);
    throw new Error("Prescription not found");
  }

  res.json(prescription);
});

// ==========================
// POST /api/prescriptions
// ==========================
export const createPrescription = asyncHandler(async (req, res) => {
  const { patientId, doctorId, items } = req.body; // ✅ use items

  // Validate patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Prescription must have at least one item");
  }

  const payload = {
    patientId,
    doctorId: doctorId || req.user?._id,
    items,
    status: "draft",      // valid enum
    billStatus: "pending",
  };

  const created = await Prescription.create(payload);

  const populated = await Prescription.findById(created._id)
    .populate("patientId", "firstName lastName phone")
    .populate("doctorId", "name specialization");

  res.status(201).json(populated);
});

// ==========================
// PUT /api/prescriptions/:id/dispense
// ==========================
export const dispensePrescriptionTransactional = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prescription = await Prescription.findById(id).populate("patientId", "firstName lastName");

  if (!prescription) throw new Error("Prescription not found");
  if (!prescription.items?.length) throw new Error("Prescription has no items");

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const dispenseLogs = [];
      let totalAmount = 0;
      const invoiceItems = [];

      for (const item of prescription.items) {
        const medId = item.medication;
        const qty = Number(item.quantity);
        if (!medId || !qty || qty <= 0) throw new Error("Invalid prescription item");

        // Fetch medicine
        const medicine = await Inventory.findById(medId).session(session);
        if (!medicine) throw new Error(`${item.name || medId} not found`);
        if (medicine.category !== "drug") throw new Error(`${medicine.name} is not a drug`);
        if (medicine.quantity < qty) throw new Error(`Insufficient stock for ${medicine.name}`);

        // Deduct stock
        medicine.quantity -= qty;
        medicine.status = calculateStatus(medicine);
        await medicine.save({ session });

        // Create dispense log
        const [log] = await Dispense.create(
          [
            {
              medicineId: medicine._id,
              name: medicine.name,
              quantity: qty,
              dispensedBy: req.user?._id || null,
              patientId: prescription.patientId._id,
              date: new Date(),
            },
          ],
          { session }
        );
        dispenseLogs.push(log);

        // Prepare invoice item
        invoiceItems.push({
          medicineId: medicine._id,
          name: medicine.name,
          quantity: qty,
          price: medicine.unitPrice, // or sellingPrice if exists
        });
        totalAmount += qty * medicine.unitPrice;
      }

      // Mark prescription dispensed
      prescription.status = "dispensed";
      prescription.dispensedAt = new Date();
      await prescription.save({ session });

      // Create invoice
      const [invoice] = await Invoice.create(
        [
          {
            patientId: prescription.patientId._id,
            items: invoiceItems,
            totalAmount,
            status: "unpaid",
            date: new Date(),
            relatedPrescriptionId: prescription._id,
            relatedDispenseIds: dispenseLogs.map((d) => d._id),
          },
        ],
        { session }
      );

      const populatedInvoice = await Invoice.findById(invoice._id).populate(
        "patientId",
        "firstName lastName phone"
      );

      res.json({
        message: "Prescription dispensed and billed",
        prescription,
        dispenseLogs,
        invoice: populatedInvoice,
      });
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Transaction failed" });
  } finally {
    session.endSession();
  }
});

// ==========================
// GET /api/prescriptions/patient/:patientId
// ==========================
export const getPrescriptionsByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const prescriptions = await Prescription.find({ patientId })
    .populate("doctorId", "name specialization")
    .sort({ createdAt: -1 });

  res.json(prescriptions);
});

// ==========================
// GET /api/prescriptions/summary
// ==========================
export const getPrescriptionSummary = asyncHandler(async (req, res) => {
  const statusSummary = await Prescription.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const revenue = await Invoice.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);

  res.json({
    statusSummary,
    revenue: revenue[0]?.totalRevenue || 0,
  });
});

// ==========================
// PATCH /api/prescriptions/:id/cancel
// ==========================
export const cancelPrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prescription = await Prescription.findById(id);

  if (!prescription) {
    res.status(404);
    throw new Error("Prescription not found");
  }
  if (prescription.status === "dispensed") {
    res.status(400);
    throw new Error("Cannot cancel a dispensed prescription");
  }

  prescription.status = "cancelled";
  await prescription.save();

  res.json({ message: "Prescription cancelled", prescription });
});
