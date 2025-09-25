import Staff from "../models/Staff.js";

// @desc    Get all staff
// @route   GET /api/staff
// @access  Private (admin only ideally)
export const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch staff", error: err.message });
  }
};

// @desc    Get single staff by ID
// @route   GET /api/staff/:id
// @access  Private
export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching staff", error: err.message });
  }
};

// @desc    Create new staff
// @route   POST /api/staff
// @access  Private (admin only)
export const createStaff = async (req, res) => {
  try {
    const staff = new Staff(req.body);
    const createdStaff = await staff.save();
    res.status(201).json(createdStaff);
  } catch (err) {
    res.status(400).json({ message: "Error creating staff", error: err.message });
  }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private (admin only)
export const updateStaff = async (req, res) => {
  try {
    const updated = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Staff not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Error updating staff", error: err.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private (admin only)
export const deleteStaff = async (req, res) => {
  try {
    const deleted = await Staff.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Staff not found" });
    res.json({ message: "Staff deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting staff", error: err.message });
  }
};
