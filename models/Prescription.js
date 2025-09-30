// models/Prescription.js
import mongoose from 'mongoose';

// Schema for each prescription item
const prescriptionItemSchema = new mongoose.Schema(
  {
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',   // Linked to Inventory model
      required: true,
    },
    dosage: { 
      type: String,
      trim: true,
    },
    frequency: { 
      type: String,
      trim: true,
    },
    duration: { 
      type: String,
      trim: true,
    },
    quantity: { 
      type: Number, 
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
    instructions: { 
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

// Main prescription schema
const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // optional if auth is off
    },
    items: {
      type: [prescriptionItemSchema],
      validate: [arr => arr.length > 0, "Prescription must have at least one item"]
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'dispensed', 'cancelled'],
      default: 'draft',
    },
    billStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Virtual for frontend-friendly display (optional)
prescriptionSchema.virtual('totalItems').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
