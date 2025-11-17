import Patient from "../models/Patient.js";
import Staff from "../models/Staff.js";
import mongoose from "mongoose";

// ==========================
// ID Resolver (NEW)
// Allows PATXXXX or MongoID
// ==========================
const resolvePatientId = async (id) => {
  // 1. Check if ID is Mongo ObjectID
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byMongo = await Patient.findById(id);
    if (byMongo) return byMongo;
  }

  // 2. Otherwise treat it as display patientId (PATxxxx)
  return await Patient.findOne({ patientId: id });
};

// Helper: calculate age from DOB
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const diffMs = Date.now() - birthDate.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

// Helper: determine next appointment status
const nextAppointmentStatus = (nextAppointment) => {
  if (!nextAppointment) return "No Appointment";
  const today = new Date();
  const appointmentDate = new Date(nextAppointment);
  return appointmentDate >= today ? "Upcoming" : "Overdue";
};

// Format patient for frontend
const formatPatient = (patient) => {
  const obj = patient.toObject({ virtuals: true });
  obj.id = obj._id.toString();
  obj.appointmentStatus = nextAppointmentStatus(obj.nextAppointment);

  if (obj.doctor && typeof obj.doctor === "object") {
    obj.doctorName = `${obj.doctor.firstName} ${obj.doctor.lastName || ""}`;
    obj.doctorSpecialty = obj.doctor.specialty || "";
    obj.doctorDepartment = obj.doctor.department || "";
  } else {
    obj.doctorName = "N/A";
    obj.doctorSpecialty = "";
    obj.doctorDepartment = "";
  }

  return obj;
};

// =====================
// CREATE patient
// =====================
export const createPatient = async (req, res) => {
  try {
    const patientData = { ...req.body };

    if (!patientData.doctor)
      return res.status(400).json({ success: false, message: "Doctor ID is required" });

    const doctorExists = await Staff.findById(patientData.doctor);
    if (!doctorExists)
      return res.status(400).json({ success: false, message: "Invalid doctor ID" });

    if (patientData.dob && !patientData.age) {
      patientData.age = calculateAge(patientData.dob);
    }

    const patient = new Patient(patientData);
    await patient.save();

    const populated = await Patient.findById(patient._id)
      .populate("doctor", "firstName lastName specialty department");

    res.status(201).json({
      success: true,
      message: "Patient created",
      patient: formatPatient(populated),
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// =====================
// GET all patients
// =====================
export const getAllPatients = async (req, res) => {
  try {
    let {
      page = 1, limit = 5, search = "",
      status = "", diagnosis = "", sortColumn = "createdAt", sortDirection = "desc"
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (search)
      query.$or = [
        { patientId: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];

    if (status) query.status = status;
    if (diagnosis) query.diagnosis = diagnosis;

    const columnMap = {
      patientId: "patientId",
      lastName: "lastName",
      age: "age",
      diagnosis: "diagnosis",
      stage: "stage",
      doctor: "doctor",
      nextAppointment: "nextAppointment",
      status: "status",
      createdAt: "createdAt",
    };

    const sortField = columnMap[sortColumn] || "createdAt";
    const sortOptions = { [sortField]: sortDirection === "asc" ? 1 : -1 };

    const totalCount = await Patient.countDocuments(query);

    const patients = await Patient.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("doctor", "firstName lastName specialty department")
      .populate("invoices")
      .populate("dispenses");

    res.status(200).json({
      success: true,
      patients: patients.map(formatPatient),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// =====================
// GET single patient
// Dual-ID support
// =====================
export const getPatientById = async (req, res) => {
  try {
    const patient = await resolvePatientId(req.params.patientId)
      .then(p => p ? p.populate("doctor", "firstName lastName specialty department") : null)
      .then(p => p ? p.populate("invoices") : null)
      .then(p => p ? p.populate("dispenses") : null);

    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    res.status(200).json({
      success: true,
      patient: formatPatient(patient),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// =====================
// UPDATE patient
// Dual-ID support
// =====================
export const updatePatient = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.doctor) {
      const doctorExists = await Staff.findById(updateData.doctor);
      if (!doctorExists)
        return res.status(400).json({ success: false, message: "Invalid doctor ID" });
    }

    if (updateData.dob) updateData.age = calculateAge(updateData.dob);

    const patient = await resolvePatientId(req.params.patientId);
    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    Object.assign(patient, updateData);
    await patient.save();

    const populated = await Patient.findById(patient._id)
      .populate("doctor", "firstName lastName specialty department")
      .populate("invoices")
      .populate("dispenses");

    res.status(200).json({
      success: true,
      message: "Patient updated",
      patient: formatPatient(populated),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// =====================
// DELETE patient
// Dual-ID support
// =====================
export const deletePatient = async (req, res) => {
  try {
    const patient = await resolvePatientId(req.params.patientId);
    if (!patient)
      return res.status(404).json({ success: false, message: "Patient not found" });

    await Patient.findByIdAndDelete(patient._id);

    res.status(200).json({ success: true, message: "Patient deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
