// models/Invoice.js
import mongoose from "mongoose";

// ===========================
// Subdocument Schema (Service)
// ===========================
const serviceSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    service: { type: String, required: true }, // e.g., "Paracetamol 500mg", "Lab Test", "Consultation"
    desc: { type: String },

    qty: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },

    // Track source (pharmacy, lab, consultation)
    source: {
      type: String,
      enum: ["pharmacy", "lab", "consultation", "other"],
      required: true,
    },

    // Reference to external doc (dynamic model)
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "services.refModel",
    },
    refModel: {
      type: String,
      enum: ["Dispense", "LabReport", "Consultation"], // Allowed linked models
    },
  },
  { _id: false }
);

// ===========================
// Payment Schema
// ===========================
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cash", "mpesa", "insurance", "card", "bank"],
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    reference: { type: String }, // Mpesa code, insurance claim, etc.
  },
  { _id: false }
);

// ===========================
// Main Invoice Schema
// ===========================
const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true },

    // Patient relationship
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientName: { type: String, required: true },

    // Services rendered
    services: [serviceSchema],

    // Payments
    payments: [paymentSchema],

    // Invoice status
    status: {
      type: String,
      enum: ["unpaid", "paid", "partial", "pending", "cancelled", "refunded"],
      default: "unpaid",
    },

    // Discounts, tax, totals
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0.16 },

    // Snapshotted values (audit-proof)
    recordedSubtotal: { type: Number, default: 0 },
    recordedTax: { type: Number, default: 0 },
    recordedTotal: { type: Number, default: 0 },

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

  // Auto-calc recorded totals (snapshot for audit)
  this.recordedSubtotal = this.services.reduce(
    (acc, s) => acc + s.qty * s.unitPrice,
    0
  );
  this.recordedTax = Math.round(this.recordedSubtotal * this.taxRate);
  this.recordedTotal =
    this.recordedSubtotal + this.recordedTax - (this.discount || 0);

  next();
});

// ===========================
// Virtuals (dynamic totals)
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
