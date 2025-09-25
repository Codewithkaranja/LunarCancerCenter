import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    diagnosis: { type: String, required: true },
    diagnosisDate: { type: Date, required: true },
    stage: { type: String, enum: ["1", "2", "3", "4"], required: true },
    treatmentPlan: {
      type: String,
      enum: ["chemo", "radio", "surgery", "combo", "palliative"],
      required: true,
    },
    allergies: { type: String },
    medicalHistory: { type: String },
    insuranceProvider: { type: String },
    insuranceId: { type: String },
    coverage: { type: String, enum: ["full", "partial", "copay"] },
    validUntil: { type: Date },
    status: { type: String, enum: ["active", "inactive", "pending"], default: "active" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    nextAppointment: { type: Date }, // optional, since appointments are tracked separately
  },
  { timestamps: true }
);

// Helper to calculate age from DOB
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const diffMs = Date.now() - birthDate.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

// Pre-save hook
patientSchema.pre("save", function (next) {
  if (this.dob) {
    this.age = calculateAge(this.dob);
  }
  next();
});

// Pre-update hook
patientSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update.dob) {
    update.age = calculateAge(update.dob);
  }
  next();
});

export default mongoose.model("Patient", patientSchema);
