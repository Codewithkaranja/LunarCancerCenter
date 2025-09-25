import Prescription from '../models/prescriptionModel.js';
import User from '../models/userModel.js';
import Patient from '../models/patientModel.js';

// @desc    Create a prescription (draft or submitted)
// @route   POST /api/prescriptions
// @access  Doctor, Admin
export const createPrescription = async (req, res) => {
  try {
    const { patient, medications, status, billStatus } = req.body;

    if (!patient || !medications || medications.length === 0) {
      return res.status(400).json({ message: 'Patient and medications are required' });
    }

    const prescription = await Prescription.create({
      patientId: patient, // assuming frontend sends patient name; ideally send patientId
      doctorId: req.user.id,
      items: medications.map(item => ({
        medication: item.medication,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
      })),
      status: status || 'draft',
      billStatus: billStatus || 'pending',
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create prescription', error });
  }
};

// @desc    Get all prescriptions (with optional filters)
// @route   GET /api/prescriptions
// @access  Doctor, Admin, Pharmacist, Cashier
export const getAllPrescriptions = async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (dateFrom || dateTo) filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    res.json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch prescriptions', error });
  }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Doctor, Admin, Pharmacist
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    res.json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch prescription', error });
  }
};

// @desc    Update prescription (edit or reissue)
// @route   PUT /api/prescriptions/:id
// @access  Doctor, Admin, Pharmacist
export const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    const { items, status, billStatus } = req.body;

    if (items) {
      prescription.items = items.map(item => ({
        medication: item.medication,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
      }));
    }
    if (status) prescription.status = status;
    if (billStatus) prescription.billStatus = billStatus;

    const updatedPrescription = await prescription.save();
    res.json(updatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update prescription', error });
  }
};

// @desc    Cancel prescription
// @route   DELETE /api/prescriptions/:id
// @access  Admin
export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    prescription.status = 'cancelled';
    prescription.billStatus = 'cancelled';
    await prescription.save();

    res.json({ message: 'Prescription cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to cancel prescription', error });
  }
};
