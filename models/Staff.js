import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    role: {
      type: String,
      enum: ["admin", "doctor", "nurse", "receptionist", "pharmacist", "labtech"],
      required: true,
    },
    department: { type: String, required: true },
    specialty: { type: String },
    email: { type: String },
    phone: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    password: { type: String }, // hash later
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ===== Virtuals =====
staffSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName || ""}`.trim();
});

staffSchema.virtual("contact").get(function () {
  return `${this.email || ""} | ${this.phone || ""}`.trim();
});

// Relationships
staffSchema.virtual("appointments", {
  ref: "Appointment",
  localField: "_id",
  foreignField: "doctor",
});

staffSchema.virtual("consultations", {
  ref: "Consultation",
  localField: "_id",
  foreignField: "staff",
});

staffSchema.virtual("prescriptions", {
  ref: "Prescription",
  localField: "_id",
  foreignField: "doctor",
});

staffSchema.virtual("labReports", {
  ref: "LabReport",
  localField: "_id",
  foreignField: "labTech",
});

staffSchema.virtual("dispenses", {
  ref: "Dispense",
  localField: "_id",
  foreignField: "staff",
});

staffSchema.virtual("inventoryChanges", {
  ref: "Inventory",
  localField: "_id",
  foreignField: "addedBy",
});

// ✅ Patient virtual synced with Patient.doctor
staffSchema.virtual("patients", {
  ref: "Patient",
  localField: "_id",
  foreignField: "doctor",
});

staffSchema.virtual("reports", {
  ref: "Report",
  localField: "_id",
  foreignField: "createdBy",
});

staffSchema.virtual("invoices", {
  ref: "Invoice",
  localField: "_id",
  foreignField: "createdBy",
});

// ===== Helper methods =====
staffSchema.methods.canBeDoctor = function () {
  return this.role === "doctor";
};

staffSchema.methods.canBeNurse = function () {
  return this.role === "nurse";
};

staffSchema.methods.canBePharmacist = function () {
  return this.role === "pharmacist";
};

// ✅ Export
export default mongoose.models.Staff || mongoose.model("Staff", staffSchema);
