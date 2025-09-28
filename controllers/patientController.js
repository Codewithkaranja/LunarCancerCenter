import Patient from '../models/Patient.js';
import mongoose from 'mongoose';

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
  if (!nextAppointment) return 'No Appointment';
  const today = new Date();
  const appointmentDate = new Date(nextAppointment);
  return appointmentDate >= today ? 'Upcoming' : 'Overdue';
};

// Helper: format patient for frontend
// Helper: format patient for frontend
const formatPatient = (patient) => {
  const obj = patient.toObject();
  obj.id = obj._id.toString();         // keep Mongo _id
  obj.patientId = obj.patientId;       // ✅ include generated patientId
  obj.appointmentStatus = nextAppointmentStatus(obj.nextAppointment);
  return obj;
};


// CREATE a new patient
export const createPatient = async (req, res) => {
  try {
    const patientData = { ...req.body };

    // --- Auth bypass ---
    // const user = req.user; 
    // if (user?.role === 'doctor') {
    //   patientData.doctor = user._id;
    // }
    const dummyUser = { _id: '64ed123abc456def7890abc1', role: 'admin' };
    patientData.doctor = patientData.doctor || dummyUser._id;

    // Calculate age
    if (patientData.dob && !patientData.age) {
      patientData.age = calculateAge(patientData.dob);
    }

    const patient = new Patient(patientData);
    await patient.save();

    res.status(201).json({ success: true, message: 'Patient created', patient: formatPatient(patient) });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// GET all patients (search, filter, pagination, sorting)
// GET all patients (search, filter, pagination, sorting)
// GET all patients (search, filter, pagination, sorting)
export const getAllPatients = async (req, res) => {
  try {
    let { 
      page = 1, 
      limit = 5, 
      search = '', 
      status = '', 
      diagnosis = '', 
      sortColumn = 'createdAt', 
      sortDirection = 'desc' 
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // 🔍 Search by patientId OR first/last name
    if (search) {
      query.$or = [
        { patientId: { $regex: search, $options: 'i' } }, // ✅ search by friendly ID
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (diagnosis) query.diagnosis = diagnosis;

    // 🔑 Align sort fields with frontend
    const columnMap = {
      patientId: 'patientId',   // ✅ friendly ID
      id: 'patientId',          // fallback if frontend sends "id"
      lastName: 'lastName',
      age: 'age',
      diagnosis: 'diagnosis',
      stage: 'stage',
      doctor: 'doctor',
      nextAppointment: 'nextAppointment',
      status: 'status',
      createdAt: 'createdAt'    // default fallback
    };

    const sortField = columnMap[sortColumn] || 'createdAt';
    const sortOptions = { [sortField]: sortDirection === 'asc' ? 1 : -1 };

    // 📋 Fetch results
    const totalCount = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      patients: patients.map(formatPatient),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// GET a single patient
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    res.status(200).json({ success: true, patient: formatPatient(patient) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE a patient
export const updatePatient = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.dob) updateData.age = calculateAge(updateData.dob);

    const patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    res.status(200).json({ success: true, message: 'Patient updated', patient: formatPatient(patient) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE a patient
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    res.status(200).json({ success: true, message: 'Patient deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
