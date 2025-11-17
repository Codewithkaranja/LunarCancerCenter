// controllers/patientController.js
import Patient from "../models/Patient.js";
import Staff from "../models/Staff.js";

import mongoose from "mongoose";

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

  obj.doctorName = obj.doctor
    ? `${obj.doctor.firstName} ${obj.doctor.lastName}`
    : "N/A";

  return obj;
};


// =====================
// CREATE
// =====================
export const createPatient = async (req, res) => {
  try {
    const patientData = { ...req.body };

    // Doctor must exist
    if (!patientData.doctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    // Verify doctor exists in Staff collection
    const doctorExists = await Staff.findById(patientData.doctor);
    if (!doctorExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID: doctor does not exist",
      });
    }

    // Calculate age if DOB provided
    if (patientData.dob && !patientData.age) {
      patientData.age = calculateAge(patientData.dob);
    }

    // Save patient
    const patient = new Patient(patientData);
    await patient.save();

    // Populate doctor details
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
// GET all patients (search, filter, pagination, sorting)
// =====================
export const getAllPatients = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 5,
      search = "",
      status = "",
      diagnosis = "",
      sortColumn = "createdAt",
      sortDirection = "desc",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { patientId: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (diagnosis) query.diagnosis = diagnosis;

    const columnMap = {
      patientId: "patientId",
      id: "patientId",
      lastName: "lastName",
      age: "age",
      diagnosis: "diagnosis",
      stage: "stage",
      doctor: "doctor",
      nextAppointment: "nextAppointment",
      status: "status",
      createdAt: "createdAt",
    };
    const sortField = columnMap[sortColumn] || sortColumn || "createdAt";

    const sortOptions = { [sortField]: sortDirection === "asc" ? 1 : -1 };

    const totalCount = await Patient.countDocuments(query);
   const patients = await Patient.find(query)
  .sort(sortOptions)
  .skip((page - 1) * limit)
  .limit(limit)
  .populate("doctor", "firstName lastName department specialty")
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
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =====================
// GET single patient by patientId
// =====================
export const getPatientById = async (req, res) => {
  try {
   const patient = await Patient.findOne({ patientId: req.params.patientId })
  .populate("doctor", "firstName lastName department specialty")
  .populate("invoices")
  .populate("dispenses");

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.status(200).json({
      success: true,
      patient: formatPatient(patient),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// =====================
// UPDATE by patientId
// =====================
export const updatePatient = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If doctor is being updated → verify it's valid
    if (updateData.doctor) {
      const doctorExists = await Staff.findById(updateData.doctor);
      if (!doctorExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor ID: doctor does not exist",
        });
      }
    }

    // Recalculate age if DOB changes
    if (updateData.dob) {
      updateData.age = calculateAge(updateData.dob);
    }

    const patient = await Patient.findOneAndUpdate(
      { patientId: req.params.patientId },
      updateData,
      { new: true }
    )
      .populate("doctor", "firstName lastName department specialty")
      .populate("invoices")
      .populate("dispenses");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated",
      patient: formatPatient(patient),
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// =====================
// DELETE by patientId
// =====================
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({
      patientId: req.params.patientId,
    });
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    res.status(200).json({ success: true, message: "Patient deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
