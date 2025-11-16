// controllers/labReportController.js
import LabReport from "../models/LabReport.js";

// GET all lab reports
export const getLabReports = async (req, res) => {
  try {
    const reports = await LabReport.find()
      .populate("patientId", "firstName lastName patientId")
      .populate("createdBy", "name role email")
      .sort({ date: -1 });
    res.status(200).json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single lab report by ID
export const getLabReportById = async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id)
      .populate("patientId", "firstName lastName patientId")
      .populate("createdBy", "name role email");

    if (!report)
      return res.status(404).json({ success: false, message: "Lab report not found" });

    res.status(200).json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE new lab report
export const createLabReport = async (req, res) => {
  try {
    // Save the report first
    const report = await LabReport.create(req.body);

    // Populate after creation
    const populatedReport = await LabReport.findById(report._id)
      .populate("patientId", "firstName lastName patientId")
      .populate("createdBy", "name role email");

    res.status(201).json({ success: true, report: populatedReport });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// UPDATE lab report
export const updateLabReport = async (req, res) => {
  try {
    const updatedReport = await LabReport.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("patientId", "firstName lastName patientId")
      .populate("createdBy", "name role email");

    if (!updatedReport)
      return res.status(404).json({ success: false, message: "Lab report not found" });

    res.status(200).json({ success: true, message: "Lab report updated", report: updatedReport });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE lab report
export const deleteLabReport = async (req, res) => {
  try {
    const report = await LabReport.findByIdAndDelete(req.params.id);

    if (!report)
      return res.status(404).json({ success: false, message: "Lab report not found" });

    res.status(200).json({ success: true, message: "Lab report deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
