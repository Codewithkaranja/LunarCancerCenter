import Inventory from "../models/Inventory.js";
import Invoice from "../models/Invoice.js"; // link with billing
import asyncHandler from "express-async-handler";

// ===== Helper: calculate stock status =====
export const calculateStatus = (item) => {
  const today = new Date();
  if (!item) return "instock";
  if (item.quantity === 0) return "out-of-stock";
  if (item.expiryDate && new Date(item.expiryDate) < today) return "expired";
  if (item.expiryDate && new Date(item.expiryDate) - today < 1000 * 60 * 60 * 24 * 30) return "expiring-soon";
  if (item.minStockLevel && item.quantity <= item.minStockLevel) return "low";
  return "adequate";
};

// ===== GET /api/inventory =====
export const getAllInventory = asyncHandler(async (req, res) => {
  const items = await Inventory.find();
  const data = items.map((it) => ({ ...it.toObject(), status: calculateStatus(it) }));
  res.json(data);
});

// ===== GET /api/inventory/:id =====
export const getInventoryById = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }
  res.json({ ...item.toObject(), status: calculateStatus(item) });
});

// ===== POST /api/inventory =====
export const addInventoryItem = asyncHandler(async (req, res) => {
  const payload = {
    name: req.body.name,
    category: req.body.category || "drug",
    quantity: Number(req.body.quantity) || 0,
    unit: req.body.unit || "unit",
    expiryDate: req.body.expiryDate || null,
    batchNumber: req.body.batchNumber || "",
    supplier: req.body.supplier || { name: "Unknown", contact: "", email: "" },
    manufactureDate: req.body.manufactureDate || null,
    manufacturer: req.body.manufacturer || "",
    costPrice: Number(req.body.costPrice) || 0,
    unitPrice: Number(req.body.unitPrice) || 0,
    minStockLevel: Number(req.body.minStockLevel) || 10,
  };

  const newItem = new Inventory(payload);
  newItem.status = calculateStatus(newItem);
  const saved = await newItem.save();
  res.status(201).json(saved);
});

// ===== PUT /api/inventory/:id =====
export const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }

  Object.keys(req.body).forEach((k) => {
    if (req.body[k] !== undefined) {
      item[k] = k === "quantity" || k === "unitPrice" || k === "minStockLevel" ? Number(req.body[k]) : req.body[k];
    }
  });

  item.status = calculateStatus(item);
  const updated = await item.save();
  res.json(updated);
});

// ===== PUT /api/inventory/:id/restock =====
export const restockInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }
  const qty = Number(req.body.quantity);
  if (isNaN(qty) || qty <= 0) {
    res.status(400);
    throw new Error("Invalid restock quantity");
  }
  item.quantity += qty;
  if (req.body.batchNumber) item.batchNumber = req.body.batchNumber;
  if (req.body.expiryDate) item.expiryDate = req.body.expiryDate;
  item.status = calculateStatus(item);
  const saved = await item.save();
  res.json(saved);
});

// ===== PUT /api/inventory/:id/consume =====
export const consumeInventoryItem = asyncHandler(async (req, res) => {
  const { quantity, patientId, invoiceId } = req.body;
  const item = await Inventory.findById(req.params.id);

  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0 || qty > item.quantity) {
    res.status(400);
    throw new Error("Invalid consumption quantity");
  }

  // Deduct stock
  item.quantity -= qty;
  item.status = calculateStatus(item);
  await item.save();

  // Optional: attach to patient invoice
  if (patientId) {
    let invoice = invoiceId ? await Invoice.findById(invoiceId) : null;
    if (!invoice) {
      invoice = new Invoice({
        patientId,
        services: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        status: "unpaid",
        date: new Date(),
      });
    }

    invoice.services.push({
      service: `${item.name}`,
      qty,
      unitPrice: item.unitPrice,
      source: "pharmacy",
    });

    await invoice.save();
  }

  res.json({ message: "Item dispensed successfully", item });
});

// ===== DELETE /api/inventory/:id =====
export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const deleted = await Inventory.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error("Item not found");
  }
  res.json({ message: "Item deleted" });
});

// ===== GET /api/inventory/reports =====
export const getInventoryReports = asyncHandler(async (req, res) => {
  const items = await Inventory.find();
  const data = items.map((i) => ({
    id: i._id,
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    expiryDate: i.expiryDate || null,
    batchNumber: i.batchNumber || null,
    supplier: i.supplier,
    status: calculateStatus(i),
  }));
  res.json(data);
});
