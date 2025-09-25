import Inventory from '../models/inventoryModel.js';

// ==========================
// Utility: Calculate status dynamically
// ==========================
const calculateStatus = (item) => {
  const today = new Date();
  if (item.quantity === 0) return 'out';
  if (item.reorderLevel && item.quantity < item.reorderLevel) return 'low';
  if (item.expiry && new Date(item.expiry) < today) return 'expired';
  return 'instock';
};

// ==========================
// GET All Inventory
// ==========================
export const getAllInventory = async (req, res) => {
  try {
    const items = await Inventory.find();
    const data = items.map(item => ({
      ...item.toObject(),
      status: calculateStatus(item),
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// GET One Inventory Item
// ==========================
export const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ ...item.toObject(), status: calculateStatus(item) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// POST Add New Inventory Item
// ==========================
export const addInventoryItem = async (req, res) => {
  try {
    const { status, ...itemBody } = req.body; // ignore any frontend status
    const itemData = {
      ...itemBody,
      status: calculateStatus(req.body),
    };

    // Auto-generate ID if not provided
    if (!itemData.id) itemData.id = `INV-${Date.now()}-${Math.floor(Math.random()*1000)}`;

    const newItem = new Inventory(itemData);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==========================
// PUT Update / Restock Inventory Item
// ==========================
export const updateInventoryItem = async (req, res) => {
  try {
    const { quantity, ...otherFields } = req.body;
    const item = await Inventory.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Update all provided fields
    Object.assign(item, otherFields);

    // Restock logic if quantity is provided
    if (quantity !== undefined) {
      const qty = Number(quantity);
      if (isNaN(qty) || qty < 0) return res.status(400).json({ message: 'Quantity must be a non-negative number' });
      item.quantity = qty;
    }

    // Recalculate status
    item.status = calculateStatus(item);

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ==========================
// DELETE Inventory Item
// ==========================
export const deleteInventoryItem = async (req, res) => {
  try {
    const deleted = await Inventory.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
