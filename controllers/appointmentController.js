// ================================
// appointmentController.js (Production Ready, Polished)
// ================================

import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Staff from "../models/Staff.js";

// ================================
// Utility: Safe error responder
// ================================
const handleError = (res, err, message = "Server error") => {
  console.error("🔥 Controller Error:", err);
  res.status(500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { error: err.message } : {}),
  });
};

// ================================
// GET all appointments
// ================================
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "patientId firstName lastName")
      .populate("doctor", "firstName lastName role")
      .sort({ date: 1 })
      .lean();

    res.status(200).json({ success: true, appointments });
  } catch (err) {
    handleError(res, err, "Failed to fetch appointments");
  }
};

// ================================
// GET appointments for a specific patient
// ================================
export const getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId)
      return res.status(400).json({ success: false, message: "Missing patient ID" });

    const patient = await Patient.findOne({
      $or: [{ patientId }, { _id: patientId }],
    });

    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    const appointments = await Appointment.find({ patient: patient._id })
      .populate("patient", "patientId firstName lastName")
      .populate("doctor", "firstName lastName role")
      .sort({ date: 1 })
      .lean();

    res.status(200).json({ success: true, appointments });
  } catch (err) {
    handleError(res, err, "Error fetching appointments");
  }
};

// ================================
// GET appointment by ID
// ================================
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid appointment ID" });

    const appointment = await Appointment.findById(id)
      .populate("patient", "patientId firstName lastName")
      .populate("doctor", "firstName lastName role");

    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    res.status(200).json({ success: true, appointment });
  } catch (err) {
    handleError(res, err, "Error fetching appointment");
  }
};

// ================================
// CREATE appointment
// ================================
export const createAppointment = async (req, res) => {
  try {
    console.log("🩺 Incoming appointment payload:", req.body);
    const { patient, doctor, date, time } = req.body;

    // Validate patient
    if (!mongoose.Types.ObjectId.isValid(patient))
      return res.status(400).json({ success: false, message: "Invalid patient ID format" });

    const patientExists = await Patient.findById(patient);
    if (!patientExists)
      return res.status(400).json({ success: false, message: "Patient not found" });

    // Validate doctor (optional)
    let doctorExists = null;
    if (doctor) {
      if (!mongoose.Types.ObjectId.isValid(doctor))
        return res.status(400).json({ success: false, message: "Invalid doctor ID format" });

      doctorExists = await Staff.findById(doctor);
      if (!doctorExists)
        return res.status(400).json({ success: false, message: "Doctor not found" });
    }

    // Validate appointment date/time
    if (!date || !time)
      return res.status(400).json({ success: false, message: "Date and time are required" });

    const appointment = new Appointment(req.body);
    const saved = await appointment.save();

    const populated = await saved.populate([
      { path: "patient", select: "patientId firstName lastName" },
      ...(doctorExists ? [{ path: "doctor", select: "firstName lastName role" }] : []),
    ]);

    console.log("✅ Appointment created successfully:", populated._id);
    res.status(201).json({ success: true, appointment: populated });
  } catch (err) {
    handleError(res, err, "Error creating appointment");
  }
};

// ================================
// UPDATE appointment
// ================================
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid appointment ID" });

    // Validate doctor if provided
    if (doctor && !mongoose.Types.ObjectId.isValid(doctor))
      return res.status(400).json({ success: false, message: "Invalid doctor ID format" });

    let doctorExists = null;
    if (doctor) {
      doctorExists = await Staff.findById(doctor);
      if (!doctorExists)
        return res.status(400).json({ success: false, message: "Doctor not found" });
    }

    const updated = await Appointment.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    const populated = await updated.populate([
      { path: "patient", select: "patientId firstName lastName" },
      ...(doctorExists ? [{ path: "doctor", select: "firstName lastName role" }] : []),
    ]);

    res.status(200).json({ success: true, appointment: populated });
  } catch (err) {
    handleError(res, err, "Error updating appointment");
  }
};

// ================================
// DELETE appointment
// ================================
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid appointment ID" });

    const deleted = await Appointment.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    res.status(200).json({ success: true, message: "Appointment deleted successfully" });
  } catch (err) {
    handleError(res, err, "Error deleting appointment");
  }
};
