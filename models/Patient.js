import mongoose from "mongoose";
import Counter from "./Counter.js"; // for patientId auto-increment

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true },

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date, required: true },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },

    // Medical details
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

    // Insurance
    insuranceProvider: { type: String },
    insuranceId: { type: String },
    coverage: { type: String, enum: ["full", "partial", "copay"] },
    validUntil: { type: Date },

    // Status + doctor
    status: { type: String, enum: ["active", "inactive", "pending"], default: "active" },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: false },

    nextAppointment: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ===== Helper: calculate age =====
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const diffMs = Date.now() - birthDate.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

// ===== Pre-save hook =====
patientSchema.pre("save", async function (next) {
  if (this.dob) this.age = calculateAge(this.dob);

  // Auto-increment patientId
  if (!this.patientId) {
    const counter = await Counter.findOneAndUpdate(
      { name: "patientId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.patientId = `PAT${String(counter.seq).padStart(4, "0")}`;
  }

  next();
});

// ===== Pre-update hook =====
patientSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate();
  if (update.dob) update.age = calculateAge(update.dob);
  next();
});

// ===== Virtual relationships =====
patientSchema.virtual("invoices", {
  ref: "Invoice",
  localField: "_id",
  foreignField: "patientId",
});

patientSchema.virtual("dispenses", {
  ref: "Dispense",
  localField: "_id",
  foreignField: "patientId",
});

// ✅ Optional: populate doctor name easily
patientSchema.virtual("doctorName").get(function () {
  return this.doctor ? `${this.doctor.firstName} ${this.doctor.lastName || ""}` : "N/A";
});

// ===== Export =====
export default mongoose.models.Patient || mongoose.model("Patient", patientSchema);
