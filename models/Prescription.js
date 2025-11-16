import mongoose from "mongoose";

// ==========================
// Schema for each prescription item
// ==========================
const prescriptionItemSchema = new mongoose.Schema(
  {
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
    instructions: { type: String, trim: true },
  },
  { _id: true } // Keep _id for each item for updates
);

// ==========================
// Main prescription schema
// ==========================
const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: {
      type: [prescriptionItemSchema],
      validate: [arr => arr.length > 0, "Prescription must have at least one item"],
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "dispensed", "cancelled"],
      default: "draft",
    },
    billStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    notes: { type: String, trim: true },
    dispensedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
