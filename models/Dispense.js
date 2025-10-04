// models/Dispense.js
import mongoose from "mongoose";

const dispenseSchema = new mongoose.Schema(
  {
    // Medicine reference
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    // Snapshotted details at time of dispense
    medicineName: { type: String, required: true },
    unitPrice: { type: Number, required: true }, // snapshot price at dispense
    quantity: { type: Number, required: true },

    // Patient reference
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },

    // Staff / user who dispensed
    dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Billing linkage
    relatedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },

    // Event date
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for performance
dispenseSchema.index({ patientId: 1 });
dispenseSchema.index({ medicineId: 1 });
dispenseSchema.index({ date: -1 });

/**
 * Middleware: After saving a dispense,
 * automatically push service line into related Invoice (if provided).
 */
dispenseSchema.post("save", async function (doc, next) {
  if (doc.relatedInvoiceId) {
    try {
      const Invoice = mongoose.model("Invoice");

      await Invoice.findByIdAndUpdate(doc.relatedInvoiceId, {
        $push: {
          services: {
            date: doc.date,
            service: doc.medicineName,
            desc: `Dispensed ${doc.quantity} unit(s)`,
            qty: doc.quantity,
            unitPrice: doc.unitPrice,
            source: "pharmacy",
            refId: doc._id,
            refModel: "Dispense",
          },
        },
      });
    } catch (err) {
      console.error("Failed to sync Dispense with Invoice:", err.message);
    }
  }
  next();
});

export default mongoose.model("Dispense", dispenseSchema);
