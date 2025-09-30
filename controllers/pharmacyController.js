// ==========================
// pharmacyController.js
// ==========================
import Inventory from '../models/Inventory.js';
import Dispense from '../models/Dispense.js';
import asyncHandler from 'express-async-handler';
import { calculateStatus } from './inventoryController.js';  // ✅ reuse status helper

// ==========================
// Get all medicines (only drugs)
// ==========================
export const getAllMedicines = asyncHandler(async (req, res) => {
  const medicines = await Inventory.find({ category: 'drug' });
  res.json(medicines);
});

// ==========================
// Get single medicine by ID
// ==========================
export const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Inventory.findById(req.params.id);

  if (!medicine || medicine.category !== 'drug') {
    res.status(404);
    throw new Error('Medicine not found');
  }

  res.json(medicine);
});

// ==========================
// Dispense Medicine
// ==========================
export const dispenseMedicine = asyncHandler(async (req, res) => {
  const { itemId, quantity, patientId } = req.body;

  if (!itemId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error('Invalid item or quantity');
  }

  // Find medicine
  const medicine = await Inventory.findById(itemId);
  if (!medicine || medicine.category !== 'drug') {
    res.status(404);
    throw new Error('Medicine not found in inventory');
  }

  // Check stock
  if (medicine.quantity < quantity) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  // Deduct stock
  medicine.quantity -= quantity;

  // Update status (using shared helper)
  medicine.status = calculateStatus(medicine);

  await medicine.save();

  // Log dispense transaction
  const dispenseLog = await Dispense.create({
    medicineId: medicine._id.toString(),
    name: medicine.name,
    quantity,
    dispensedBy: req.user?._id || null,
    patientId: patientId || "N/A",
    date: new Date(),
  });

  res.json({
    message: `${quantity} units of ${medicine.name} dispensed`,
    medicine,
    transaction: dispenseLog,
  });
});
