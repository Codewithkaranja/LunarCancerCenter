import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "patientId"
  seq: { type: Number, default: 0 }
});

export default mongoose.model("Counter", counterSchema);
