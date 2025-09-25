const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, enum: ["drug", "consumable", "equipment"], required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    expiryDate: { type: Date, default: null },
    description: { type: String, default: "" },

    // Supplier Info
    supplierName: { type: String, default: "Unknown" },
    supplierContact: { type: String, default: "" },
    supplierEmail: { type: String, default: "" },
    batchNumber: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
    manufactureDate: { type: Date, default: null },

    // Pricing & Stock
    costPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    minimumStock: { type: Number, default: 5 },
    taxRate: { type: Number, default: 16 },
    insuranceCovered: { type: String, enum: ["yes", "no", "partial"], default: "yes" },

    // Status (calculated)
    status: { type: String, enum: ["instock", "low", "out", "expired"], default: "instock" },
  },
  { timestamps: true }
);

// Middleware to calculate status before save
inventorySchema.pre("save", function (next) {
  const today = new Date();

  if (this.quantity === 0) {
    this.status = "out";
  } else if (this.expiryDate && this.expiryDate < today) {
    this.status = "expired";
  } else if (this.quantity < this.reorderLevel) {
    this.status = "low";
  } else {
    this.status = "instock";
  }

  next();
});

module.exports = mongoose.model("Inventory", inventorySchema);
