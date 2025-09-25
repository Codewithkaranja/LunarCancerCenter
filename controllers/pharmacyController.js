import Medicine from '../models/Medicine.js'; // Assuming your inventory schema is called Medicine
import asyncHandler from 'express-async-handler';

// @desc    Get all medicines
// @route   GET /api/pharmacy
// @access  Protected
const getAllMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.find().sort({ name: 1 });
  res.json(medicines);
});

// @desc    Get single medicine by ID
// @route   GET /api/pharmacy/:id
// @access  Protected
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }
  res.json(medicine);
});

// @desc    Create new medicine
// @route   POST /api/pharmacy
// @access  Admin, Pharmacist
const createMedicine = asyncHandler(async (req, res) => {
  const { name, batchNumber, expiryDate, quantity, unitPrice, category } = req.body;

  if (!name || !batchNumber || !expiryDate || !quantity || !unitPrice || !category) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Determine status based on quantity and expiry
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

  let status = 'adequate';
  if (quantity < 10) status = 'low';
  if (daysUntilExpiry <= 0) status = 'expired';
  else if (daysUntilExpiry < 30) status = 'expiring-soon';

  const medicine = await Medicine.create({
    name,
    batchNumber,
    expiryDate,
    quantity,
    unitPrice,
    category,
    status,
  });

  res.status(201).json(medicine);
});

// @desc    Update existing medicine
// @route   PUT /api/pharmacy/:id
// @access  Admin, Pharmacist
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  const { name, batchNumber, expiryDate, quantity, unitPrice, category } = req.body;

  medicine.name = name || medicine.name;
  medicine.batchNumber = batchNumber || medicine.batchNumber;
  medicine.expiryDate = expiryDate || medicine.expiryDate;
  medicine.quantity = quantity != null ? quantity : medicine.quantity;
  medicine.unitPrice = unitPrice != null ? unitPrice : medicine.unitPrice;
  medicine.category = category || medicine.category;

  // Update status
  const today = new Date();
  const expiry = new Date(medicine.expiryDate);
  const daysUntilExpiry = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

  if (medicine.quantity < 10) medicine.status = 'low';
  else if (daysUntilExpiry <= 0) medicine.status = 'expired';
  else if (daysUntilExpiry < 30) medicine.status = 'expiring-soon';
  else medicine.status = 'adequate';

  const updatedMedicine = await medicine.save();
  res.json(updatedMedicine);
});

// @desc    Delete medicine
// @route   DELETE /api/pharmacy/:id
// @access  Admin
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) {
    res.status(404);
    throw new Error('Medicine not found');
  }

  await medicine.remove();
  res.json({ message: 'Medicine removed' });
});

export {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
