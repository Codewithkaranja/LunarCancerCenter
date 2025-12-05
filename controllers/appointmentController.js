import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Staff from "../models/Staff.js";

// Error handler
const handleError = (res, err, message = "Server error") => {
  console.error("🔥 Controller Error:", err);
  res.status(500).json({ success: false, message });
};

// GET all appointments
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

// GET appointments by patient
export const getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({
      $or: [{ _id: patientId }, { patientId }]
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

// GET appointment by ID
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

// CREATE appointment
export const createAppointment = async (req, res) => {
  try {
    const { patient, doctor, date, time } = req.body;

    let patientDoc;
    patientDoc = mongoose.Types.ObjectId.isValid(patient)
      ? await Patient.findById(patient)
      : await Patient.findOne({ patientId: patient });

    if (!patientDoc)
      return res.status(400).json({ success: false, message: "Patient not found" });

    let doctorDoc = null;
    if (doctor) {
      doctorDoc = await Staff.findById(doctor);
      if (!doctorDoc)
        return res.status(400).json({ success: false, message: "Doctor not found" });
    }

    const appointment = new Appointment({
      ...req.body,
      patient: patientDoc._id,
      doctor: doctorDoc ? doctorDoc._id : null,
    });

    const saved = await appointment.save();
    res.status(201).json({ success: true, appointment: saved });
  } catch (err) {
    handleError(res, err, "Error creating appointment");
  }
};

// UPDATE appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid appointment ID" });

    const updated = await Appointment.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    res.status(200).json({ success: true, appointment: updated });
  } catch (err) {
    handleError(res, err, "Error updating appointment");
  }
};

// DELETE appointment
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
