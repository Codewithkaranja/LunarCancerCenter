import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient", // Link to Patient collection
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff", // Link to Staff/Doctor collection
      required: true,
    },
    department: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Canceled"],
      default: "Scheduled",
    },
    notes: { type: String },

    // ===== Extra Fields from Frontend =====
    type: { type: String, default: "" },              // appointment type
    reason: { type: String, default: "" },            // reason for visit
    symptoms: { type: String, default: "" },          // symptoms
    diagnosis: { type: String, default: "" },         // diagnosis
    treatment: { type: String, default: "" },         // treatment
    prescription: { type: String, default: "" },      // prescription
    billingAmount: { type: Number, default: 0 },      // consultation fee or billing amount
    billingStatus: {
      type: String,
      enum: ["unpaid", "paid", "pending"],
      default: "unpaid",
    },
    paymentMethod: { type: String, default: "" },     // payment method
    insuranceProvider: { type: String, default: "" }, // insurance provider
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
