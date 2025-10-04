// controllers/consultationController.js
import Consultation from "../models/Consultation.js";

// GET all consultations
export const getConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find()
      .populate("patientId", "firstName lastName patientId")
      .populate("doctorId", "name role email")
      .sort({ date: -1 });
    res.status(200).json({ success: true, consultations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single consultation by ID
export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate("patientId", "firstName lastName patientId")
      .populate("doctorId", "name role email");
    if (!consultation)
      return res.status(404).json({ success: false, message: "Consultation not found" });
    res.status(200).json({ success: true, consultation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE new consultation
export const createConsultation = async (req, res) => {
  try {
    const consultation = new Consultation(req.body);
    await consultation.save();
    await consultation.populate("patientId", "firstName lastName patientId")
                       .populate("doctorId", "name role email");
    res.status(201).json({ success: true, consultation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// UPDATE consultation
export const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("patientId", "firstName lastName patientId")
      .populate("doctorId", "name role email");
    if (!consultation)
      return res.status(404).json({ success: false, message: "Consultation not found" });
    res.status(200).json({ success: true, message: "Consultation updated", consultation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE consultation
export const deleteConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndDelete(req.params.id);
    if (!consultation)
      return res.status(404).json({ success: false, message: "Consultation not found" });
    res.status(200).json({ success: true, message: "Consultation deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
