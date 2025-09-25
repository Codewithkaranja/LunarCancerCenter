import Appointment from "../models/Appointment.js";

// Get all appointments
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "firstName lastName")
      .populate("doctor", "name role");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointments", error: err.message });
  }
};

// Get single appointment
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "firstName lastName")
      .populate("doctor", "name role");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching appointment", error: err.message });
  }
};

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    const saved = await appointment.save();
    const populated = await saved.populate([
      { path: "patient", select: "firstName lastName" },
      { path: "doctor", select: "name role" },
    ]);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: "Error creating appointment", error: err.message });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("patient", "firstName lastName")
      .populate("doctor", "name role");
    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Error updating appointment", error: err.message });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting appointment", error: err.message });
  }
};
