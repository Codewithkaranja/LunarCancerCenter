// controllers/inventoryController.js
import Inventory from "../models/Inventory.js";
import Invoice from "../models/Invoice.js";
import asyncHandler from "express-async-handler";

// Consume inventory and optionally attach to patient invoice
export const consumeInventoryItem = asyncHandler(async (req, res) => {
  const { quantity, patientId, invoiceId, description } = req.body;
  const item = await Inventory.findById(req.params.id);

  if (!item) {
    res.status(404);
    throw new Error("Inventory item not found");
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0 || qty > item.quantity) {
    res.status(400);
    throw new Error("Invalid quantity to consume");
  }

  // Deduct stock
  item.quantity -= qty;
  const today = new Date();
  if (item.quantity === 0) item.status = "out-of-stock";
  else if (item.quantity <= (item.minStockLevel || 10)) item.status = "low";
  await item.save();

  let invoice;
  if (patientId) {
    // Use existing invoice or create new
    if (invoiceId) {
      invoice = await Invoice.findById(invoiceId);
    }
    if (!invoice) {
      invoice = new Invoice({
        patientId,
        patientName: "", // Will populate below
        services: [],
        status: "unpaid",
        date: today,
      });
      const patient = await mongoose.model("Patient").findById(patientId);
      if (patient) invoice.patientName = `${patient.firstName} ${patient.lastName}`;
    }

    // Add service entry
    invoice.services.push({
      service: item.name,
      desc: description || "",
      qty,
      unitPrice: item.unitPrice || 0,
      source: "pharmacy",
      refId: item._id,
      refModel: "Dispense",
      date: today,
    });

    await invoice.save();
  }

  res.json({
    message: "Inventory consumed successfully",
    item,
    invoice: invoice ? invoice.toJSON({ virtuals: true }) : null,
  });
});
