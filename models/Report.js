// models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "November Billing Report"
    type: {
      type: String,
      enum: ["patient", "staff", "billing", "inventory", "custom"],
      required: true,
    },
    dateRange: { type: String }, // e.g., "1 Nov - 30 Nov 2025"

    // Who generated the report (temporarily optional for testing)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff", // make sure this matches your Staff model
      required: false, // optional for now
    },

    // Snapshots of key data at generation time (frozen copy for UX)
    snapshot: {
      summary: { type: Object }, // e.g., totals, counts, etc.
      details: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },

    // References to live data (optional)
    relatedRecords: [
      {
        model: { type: String }, // e.g., "Invoice", "Patient"
        refId: { type: mongoose.Schema.Types.ObjectId },
      },
    ],

    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
