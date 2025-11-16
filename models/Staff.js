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

// ===== Virtual for full name =====
staffSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName || ""}`.trim();
});

// ===== Virtual for contact info =====
staffSchema.virtual("contact").get(function () {
  return `${this.email || ""} | ${this.phone || ""}`.trim();
});

// ===== Virtual relationships =====
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

staffSchema.virtual("patients", {
  ref: "Patient",
  localField: "_id",
  foreignField: "primaryDoctor",
});

staffSchema.virtual("reports", {
  ref: "Report",
  localField: "_id",
  foreignField: "createdBy",
});

// ===== Virtual for invoices created by staff =====
staffSchema.virtual("invoices", {
  ref: "Invoice",           // Name of the Invoice model
  localField: "_id",        // Staff _id
  foreignField: "createdBy" // Field in Invoice referencing staff
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

// ✅ FIXED EXPORT — prevents OverwriteModelError
export default mongoose.models.Staff || mongoose.model("Staff", staffSchema);
