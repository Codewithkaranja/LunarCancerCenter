import Inventory from "../models/Inventory.js";

// Utility: calculate status
const calculateStatus = (item) => {
  const today = new Date();
  if (item.quantity === 0) return "out";
  if (item.expiry && new Date(item.expiry) < today) return "expired";
  if (item.reorderLevel && item.quantity < item.reorderLevel) return "low";
  return "instock";
};

// ==========================
// GET all inventory
// ==========================
export const getAllInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    const data = items.map((item) => ({ ...item.toObject(), status: calculateStatus(item) }));
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
    const item = await Inventory.findOne({ id: req.params.id });
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
    const { id, name, category, quantity, unit, expiry, supplier } = req.body;
    const newItemData = {
      id: id || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      category,
      quantity: Number(quantity) || 0,
      unit,
      expiry: expiry || null,
      supplier: supplier || "Unknown",
    };
    newItemData.status = calculateStatus(newItemData);

    const newItem = new Inventory(newItemData);
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
    const item = await Inventory.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const { name, category, quantity, unit, expiry, supplier } = req.body;

    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;
    if (unit !== undefined) item.unit = unit;
    if (expiry !== undefined) item.expiry = expiry || null;
    if (supplier !== undefined) item.supplier = supplier || "Unknown";
    if (quantity !== undefined) {
      const qty = Number(quantity);
      if (isNaN(qty) || qty < 0) return res.status(400).json({ message: "Quantity must be non-negative" });
      item.quantity = qty;
    }

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
    const deleted = await Inventory.findOneAndDelete({ id: req.params.id });
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
    const item = await Inventory.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const { quantity } = req.body; // frontend sends quantity to add
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: "Invalid quantity" });

    item.quantity += qty;
    item.status = calculateStatus(item);
    await item.save();

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
