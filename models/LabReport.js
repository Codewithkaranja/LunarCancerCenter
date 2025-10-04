// models/LabReport.js
import mongoose from "mongoose";

const labReportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  testName: { type: String, required: true },   // e.g. "Malaria Test"
  result: { type: String },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  date: { type: Date, default: Date.now },

  // Optional: link to staff/lab tech
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
  }
}, { timestamps: true });

export default mongoose.model("LabReport", labReportSchema);
