import Inventory from "../models/Inventory.js";
import Dispense from "../models/Dispense.js"; // new model
// Helper to determine stock status
export const calculateStatus = (item) => {
  const today = new Date();
  if (item.quantity === 0) return "out";
  if (item.expiry && new Date(item.expiry) < today) return "expired";
  if (item.expiry && new Date(item.expiry) - today < 1000 * 60 * 60 * 24 * 30)
    return "expiringSoon";
  if (item.reorderLevel && item.quantity < item.reorderLevel) return "low";
  return "instock";
};


// ==========================
// GET all inventory
// ==========================
export const getAllInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    const data = items.map((item) => ({
      ...item.toObject(),
      status: calculateStatus(item),
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// GET inventory item by ID
// ==========================
export const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ ...item.toObject(), status: calculateStatus(item) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// POST: add new inventory item
// ==========================
export const addInventoryItem = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      quantity: Number(req.body.quantity) || 0,
      costPrice: Number(req.body.costPrice) || 0,
      sellingPrice: Number(req.body.sellingPrice) || 0,
      reorderLevel: Number(req.body.reorderLevel) || 10,
      minimumStock: Number(req.body.minimumStock) || 5,
      taxRate: Number(req.body.taxRate) || 16,
      supplier: req.body.supplier || "Unknown",
      expiry: req.body.expiry || null,
      manufactureDate: req.body.manufactureDate || null,
    };

    payload.status = calculateStatus(payload);

    const newItem = new Inventory(payload);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==========================
// PUT: update inventory item
// ==========================
export const updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        item[key] = key === "quantity" ? Number(req.body[key]) : req.body[key];
      }
    });

    item.status = calculateStatus(item);
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==========================
// DELETE: remove inventory item
// ==========================
export const deleteInventoryItem = async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// PUT: restock inventory item
// ==========================
export const restockInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const qty = Number(req.body.quantity);
    if (isNaN(qty) || qty <= 0)
      return res.status(400).json({ message: "Invalid quantity" });

    item.quantity += qty;
    item.status = calculateStatus(item);
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==========================
// Pharmacy Module
// ==========================
export const getPharmacyInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    const data = items.map((item) => ({
      ...item.toObject(),
      status: calculateStatus(item),
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const dispenseInventoryItem = async (req, res) => {
  try {
    const { itemId, quantity, patientId } = req.body;
    const item = await Inventory.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0 || qty > item.quantity)
      return res.status(400).json({ message: "Invalid dispense quantity" });

    // Deduct stock
    item.quantity -= qty;
    item.status = calculateStatus(item);
    await item.save();

    // Log dispense with patient ObjectId ref
    const log = new Dispense({
      medicineId: item._id,
      name: item.name,
      patientId: patientId || null, // <-- expects ObjectId (Patient._id)
      quantity: qty,
      dispensedBy: req.user ? req.user._id : null, // pharmacist/admin
      date: new Date(),
    });

    await log.save();

    // Populate references for response (optional)
    const populatedLog = await log
      .populate("dispensedBy", "name role")
      .populate("patientId", "firstName lastName phone");

    res.json({ item, log: populatedLog });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==========================
// Inventory Reports
// ==========================
export const getInventoryReports = async (req, res) => {
  try {
    const items = await Inventory.find();
    const data = items.map((item) => ({
      id: item._id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiry: item.expiry ? item.expiry.toISOString() : "N/A",
      supplier: item.supplier,
      status: calculateStatus(item),
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
