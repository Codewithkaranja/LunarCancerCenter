// models/Prescription.js
import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema(
  {
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',   // 👈 linked to Inventory model
      required: true,
    },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
    quantity: { type: Number, default: 1 },
    instructions: { type: String },
  },
  { _id: false }
);

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
      required: false, // keep false since auth is off
    },
    items: [prescriptionItemSchema],
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

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
