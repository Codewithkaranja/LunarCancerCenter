// controllers/prescriptionController.js
import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import Inventory from '../models/Inventory.js';

// ==========================
// Create Prescription
// ==========================
export const createPrescription = async (req, res) => {
  try {
    const { patientId, items, status, billStatus } = req.body;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Patient and medications are required' });
    }

    // Map items to inventory references
    const mappedItems = items.map(item => ({
      medication: item.medicationId, // must match frontend field
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      instructions: item.instructions,
    }));

    const prescription = await Prescription.create({
      patientId,
      items: mappedItems,
      status: status || 'draft',
      billStatus: billStatus || 'pending',
    });

    const populatedPrescription = await prescription
      .populate('patientId', 'firstName lastName')
      .populate('items.medication', 'name category quantity unit');

    res.status(201).json(populatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create prescription', error });
  }
};

// ==========================
// Get All Prescriptions
// ==========================
export const getAllPrescriptions = async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (dateFrom || dateTo) filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'firstName lastName')
      .populate('items.medication', 'name category quantity unit');

    res.json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch prescriptions', error });
  }
};

// ==========================
// Get Prescription By ID
// ==========================
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'firstName lastName')
      .populate('items.medication', 'name category quantity unit');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    res.json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch prescription', error });
  }
};

// ==========================
// Update Prescription
// ==========================
export const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    const { items, status, billStatus } = req.body;

    // Update items if provided
    if (items) {
      prescription.items = items.map(item => ({
        medication: item.medicationId,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
      }));
    }

    if (status) prescription.status = status;
    if (billStatus) prescription.billStatus = billStatus;

    // ===== Batch stock validation & deduction if dispensed =====
    if (status === 'dispensed') {
      // Validate all items first
      for (const item of prescription.items) {
        const inventoryItem = await Inventory.findById(item.medication);
        if (!inventoryItem) {
          return res.status(404).json({ message: `Inventory item not found for medicationId: ${item.medication}` });
        }
        if (inventoryItem.quantity < item.quantity) {
          return res.status(400).json({
            message: `Not enough stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}`,
          });
        }
      }

      // Deduct stock
      for (const item of prescription.items) {
        const inventoryItem = await Inventory.findById(item.medication);
        inventoryItem.quantity -= item.quantity;
        await inventoryItem.save();
      }
    }

    const updatedPrescription = await prescription.save();

    const populatedPrescription = await updatedPrescription
      .populate('patientId', 'firstName lastName')
      .populate('items.medication', 'name category quantity unit');

    res.json(populatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update prescription', error });
  }
};

// ==========================
// Cancel Prescription
// ==========================
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
