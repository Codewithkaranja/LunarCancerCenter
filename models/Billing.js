// models/Invoice.js
import mongoose from "mongoose";

// ===========================
// Subdocument Schema (Service)
// ===========================
const serviceSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    service: { type: String, required: true },
    desc: { type: String },
    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
);

// ===========================
// Main Invoice Schema
// ===========================
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true }, // e.g., "INV-2025-0012"

    // Patient relationship
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientName: { type: String, required: true },

    // Services rendered
    services: [serviceSchema],

    // Billing status
    status: {
      type: String,
      enum: ["unpaid", "paid", "pending"],
      default: "unpaid",
    },

    // Discounts, tax, totals
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0.16 }, // 16% default tax

    // Dates
    date: { type: Date, default: Date.now },
    dueDate: { type: Date },

    // Staff who created the invoice
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true }
);

// ===========================
// Auto-generate invoiceNumber
// ===========================
invoiceSchema.pre("save", function (next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  }
  next();
});

// ===========================
// Virtuals for totals
// ===========================
invoiceSchema.virtual("subtotal").get(function () {
  return this.services.reduce((acc, s) => acc + s.qty * s.unitPrice, 0);
});

invoiceSchema.virtual("tax").get(function () {
  return Math.round(this.subtotal * this.taxRate);
});

invoiceSchema.virtual("total").get(function () {
  return this.subtotal + this.tax - (this.discount || 0);
});

invoiceSchema.set("toJSON", { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

export default mongoose.model("Invoice", invoiceSchema);
