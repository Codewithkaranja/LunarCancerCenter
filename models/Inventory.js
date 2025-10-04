import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["drug", "consumable", "equipment"],
      required: true,
    },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true }, // e.g., tablets, ml, pcs

    // Dates
    expiryDate: { type: Date },          // matches controller
    manufactureDate: { type: Date },

    // Supplier Info
    supplier: {
      name: { type: String, default: "Unknown" },
      contact: { type: String, default: "" },
      email: { type: String, default: "" },
    },

    batchNumber: { type: String, default: "" },
    manufacturer: { type: String, default: "" },

    // Pricing
    costPrice: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 }, // matches controller

    // Stock Management
    minStockLevel: { type: Number, default: 10 }, // matches controller
  },
  { timestamps: true }
);

// Virtual status (matches controller logic)
inventorySchema.virtual("status").get(function () {
  const today = new Date();
  if (!this.quantity || this.quantity <= 0) return "out-of-stock";
  if (this.expiryDate && this.expiryDate < today) return "expired";
  if (this.quantity <= this.minStockLevel) return "low";
  return "adequate";
});

export default mongoose.model("Inventory", inventorySchema);
