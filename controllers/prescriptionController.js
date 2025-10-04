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
// GET /api/prescriptions?status=pending
// ==========================
export const getPrescriptions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const prescriptions = await Prescription.find(filter)
    .populate("patient", "firstName lastName phone")
    .populate("doctor", "name specialization")
    .sort({ createdAt: -1 });

  res.json(prescriptions);
});

// ==========================
// GET /api/prescriptions/:id
// ==========================
export const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate("patient", "firstName lastName phone")
    .populate("doctor", "name specialization");

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
  const { patientId, doctorId, medicines } = req.body;

  // Validate patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const payload = {
    patient: patientId,
    doctor: doctorId || req.user?._id,
    medicines: medicines || [],
    status: "pending",
    date: new Date(),
  };

  const created = await Prescription.create(payload);
  const populated = await Prescription.findById(created._id)
    .populate("patient", "firstName lastName")
    .populate("doctor", "name");

  res.status(201).json(populated);
});

// ==========================
// POST /api/prescriptions/:id/dispense
// Dispense prescription + generate invoice
// ==========================
export const dispensePrescriptionTransactional = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prescription = await Prescription.findById(id).populate("patient", "firstName lastName");
  if (!prescription) throw new Error("Prescription not found");
  if (!prescription.medicines?.length) throw new Error("Prescription has no medicines");

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const dispenseLogs = [];
      let totalAmount = 0;
      const invoiceItems = [];

      for (const medEntry of prescription.medicines) {
        const medId = medEntry.medicineId;
        const qty = Number(medEntry.quantity);
        if (!medId || !qty || qty <= 0) throw new Error("Invalid medicine entry");

        // Fetch medicine
        const medicine = await Inventory.findById(medId).session(session);
        if (!medicine) throw new Error(`${medEntry.name || medId} not found`);
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
              patientId: prescription.patient._id,
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
          price: medicine.sellingPrice,
        });
        totalAmount += qty * medicine.sellingPrice;
      }

      // Mark prescription dispensed
      prescription.status = "dispensed";
      prescription.dispensedAt = new Date();
      await prescription.save({ session });

      // Create invoice
      const [invoice] = await Invoice.create(
        [
          {
            patientId: prescription.patient._id,
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

      // Populate invoice patient
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
  const prescriptions = await Prescription.find({ patient: patientId })
    .populate("doctor", "name specialization")
    .sort({ createdAt: -1 });

  res.json(prescriptions);
});

// ==========================
// GET /api/prescriptions/summary
// ==========================
export const getPrescriptionSummary = asyncHandler(async (req, res) => {
  const summary = await Prescription.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const revenue = await Invoice.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);

  res.json({
    statusSummary: summary,
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
