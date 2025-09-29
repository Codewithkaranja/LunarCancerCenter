import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, enum: ["drug", "consumable", "equipment"], required: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    expiry: { type: Date, default: null },
    supplier: { type: String, default: "Unknown" },

    // Optional details
    description: { type: String, default: "" },

    // Supplier Info
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
    insuranceCovered: { type: String, enum: ["yes", "no", "partial"], default: "no" },

    // Status (computed)
    status: { type: String, enum: ["instock", "low", "out", "expired"], default: "instock" },
  },
  { timestamps: true }
);

// Middleware to calculate status
inventorySchema.pre("save", function (next) {
  const today = new Date();
  if (this.quantity === 0) this.status = "out";
  else if (this.expiry && this.expiry < today) this.status = "expired";
  else if (this.quantity < this.reorderLevel) this.status = "low";
  else this.status = "instock";
  next();
});

export default mongoose.model("Inventory", inventorySchema);
