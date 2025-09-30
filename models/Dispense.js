import mongoose from "mongoose";

const dispenseSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true }, 
    // changed from String → ObjectId ref Inventory for consistency

    name: { type: String, required: true }, // keep redundant name for reporting/search

    quantity: { type: Number, required: true },

    dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // pharmacist/admin

    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null }, 
    // changed from String → ObjectId ref Patient

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Dispense", dispenseSchema);
