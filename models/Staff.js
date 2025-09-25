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
    contact: { type: String }, // Matches frontend: `${email} | ${phone}`
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    password: { type: String }, // kept plain for now, secure later
  },
  { timestamps: true }
);

export default mongoose.model("Staff", staffSchema);
