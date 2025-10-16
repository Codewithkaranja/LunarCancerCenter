import mongoose from "mongoose";
import Staff from "../models/Staff.js";

// ===== GET all staff with optional filtering =====
export const getAllStaff = async (req, res) => {
  try {
    const { role, department } = req.query;

    let query = {};
    if (role) query.role = role;
    if (department) query.department = department;

    // Populate related HMIS modules
    const staff = await Staff.find(query)
      .populate("appointments")
      .populate("consultations")
      .populate("prescriptions")
      .populate("labReports")
      .populate("dispenses")
      .populate("inventoryChanges")
      .populate("patients")
      .populate("reports")
      .populate("invoice"); // remove if invoice is not linked to staff

    res.status(200).json(staff);
  } catch (err) {
    console.error("Error in getAllStaff:", err);
    res.status(500).json({ message: "Failed to fetch staff", error: err.message });
  }
};

// ===== GET single staff by ID with optional module population =====
export const getStaffById = async (req, res) => {
  try {
    const { populate } = req.query; 
    let query = Staff.findById(req.params.id);

    const validModules = [
      "appointments",
      "consultations",
      "prescriptions",
      "labReports",
      "dispenses",
      "inventoryChanges",
      "patients",
      "reports",
      "invoice"
    ];

    if (populate) {
      // Populate only requested modules if valid
      populate.split(",").forEach((mod) => {
        if (validModules.includes(mod)) query = query.populate(mod);
      });
    } else {
      // Default: populate all
      validModules.forEach((mod) => (query = query.populate(mod)));
    }

    const staff = await query;
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    res.status(200).json(staff);
  } catch (err) {
    console.error("Error in getStaffById:", err);
    res.status(500).json({ message: "Error fetching staff", error: err.message });
  }
};

// ===== CREATE new staff =====
// ===== CREATE new staff (Safe version) =====
export const createStaff = async (req, res) => {
  try {
    const { email, phone, firstName, lastName, role, department } = req.body;

    // Basic validation
    if (!firstName || !role || !department) {
      return res.status(400).json({ message: "First name, role, and department are required." });
    }

    // Check for duplicates (by email or phone)
    const existingStaff = await Staff.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingStaff) {
      return res.status(409).json({
        message: "Staff member with this email or phone already exists.",
      });
    }

    // Create new staff
    const staff = new Staff({
      firstName,
      lastName,
      role,
      department,
      email,
      phone,
      status: req.body.status || "active",
      specialty: req.body.specialty || "",
    });

    const createdStaff = await staff.save();
    res.status(201).json(createdStaff);
  } catch (err) {
    console.error("Error in createStaff:", err);

    // Handle duplicate key errors from Mongo
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        message: `Duplicate value for field '${field}'. Please use a unique value.`,
        error: err.message,
      });
    }

    res.status(400).json({ message: "Error creating staff", error: err.message });
  }
};


// ===== UPDATE staff (Safe version) =====
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone } = req.body;

    // Check if staff exists
    const existingStaff = await Staff.findById(id);
    if (!existingStaff) {
      return res.status(404).json({ message: "Staff not found." });
    }

    // Prevent duplicate email/phone across different staff
    if (email || phone) {
      const conflict = await Staff.findOne({
        $or: [{ email }, { phone }],
        _id: { $ne: id }, // exclude current record
      });

      if (conflict) {
        return res.status(409).json({
          message: "Another staff member already uses this email or phone.",
        });
      }
    }

    // Update safely
    const updatedStaff = await Staff.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Staff updated successfully.",
      staff: updatedStaff,
    });
  } catch (err) {
    console.error("Error in updateStaff:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        message: `Duplicate value for field '${field}'. Please use a unique value.`,
        error: err.message,
      });
    }

    res.status(400).json({
      message: "Error updating staff",
      error: err.message,
    });
  }
};

// ===== DELETE staff =====
// ===== DELETE staff (Safe version with dependency checks) =====
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found." });
    }

    // Check for linked data (appointments, consultations, prescriptions, etc.)
    const hasDependencies =
      (await Promise.all([
        mongoose.model("Appointment").exists({ doctor: id }),
        mongoose.model("Consultation").exists({ staff: id }),
        mongoose.model("Prescription").exists({ doctor: id }),
        mongoose.model("LabReport").exists({ labTech: id }),
        mongoose.model("Inventory").exists({ addedBy: id }),
        mongoose.model("Patient").exists({ primaryDoctor: id }),
      ])).some(Boolean);

    if (hasDependencies) {
      return res.status(400).json({
        message:
          "Cannot delete staff. They are still linked to existing records (appointments, lab reports, etc.).",
      });
    }

    await staff.deleteOne();

    res.status(200).json({
      message: "✅ Staff deleted successfully.",
      deletedId: id,
    });
  } catch (err) {
    console.error("Error in deleteStaff:", err);
    res.status(500).json({
      message: "Error deleting staff",
      error: err.message,
    });
  }
};
