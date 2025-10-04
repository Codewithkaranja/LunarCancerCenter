import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";

// Get all appointments
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "patientId firstName lastName")
      .populate("doctor", "name role")
      .sort({ date: 1 }); // upcoming first

    res.status(200).json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: err.message,
    });
  }
};

// Get all appointments for a specific patient
export const getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({
      $or: [{ patientId }, { _id: patientId }],
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const appointments = await Appointment.find({ patient: patient._id })
      .populate("patient", "patientId firstName lastName")
      .populate("doctor", "name role")
      .sort({ date: 1 });

    res.status(200).json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: err.message,
    });
  }
};

// Get single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "patientId firstName lastName")
      .populate("doctor", "name role");

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching appointment",
      error: err.message,
    });
  }
};

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    const saved = await appointment.save();
    const populated = await saved.populate([
      { path: "patient", select: "patientId firstName lastName" },
      { path: "doctor", select: "name role" },
    ]);

    res.status(201).json({ success: true, appointment: populated });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating appointment",
      error: err.message,
    });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    })
      .populate("patient", "patientId firstName lastName")
      .populate("doctor", "name role");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, appointment: updated });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error updating appointment",
      error: err.message,
    });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting appointment",
      error: err.message,
    });
  }
};
