import Appointment from "../models/Appointment.js";

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "name age phone")   // pull patient details
      .populate("doctor", "name role department"); // pull staff/doctor details

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch appointments", error: err.message });
  }
};

// @desc    Get single appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "name age phone")
      .populate("doctor", "name role department");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: "Error fetching appointment", error: err.message });
  }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (admin, nurse, doctor, receptionist, pharmacist)
export const createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    const createdAppointment = await appointment.save();

    // Populate patient + doctor before sending response
    const populated = await createdAppointment.populate([
      { path: "patient", select: "name age phone" },
      { path: "doctor", select: "name role department" },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: "Error creating appointment", error: err.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private (admin, nurse, doctor, receptionist)
export const updateAppointment = async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("patient", "name age phone")
      .populate("doctor", "name role department");

    if (!updated) return res.status(404).json({ message: "Appointment not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Error updating appointment", error: err.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (admin only)
export const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting appointment", error: err.message });
  }
};
