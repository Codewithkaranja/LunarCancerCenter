import mongoose from "mongoose";
import Staff from "../models/Staff.js";

// ===== GET all staff with optional filtering =====
export const getAllStaff = async (req, res) => {
  try {
    const { role, department } = req.query;

    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;

    // Populate related modules including invoices
    const staff = await Staff.find(query)
      .populate("appointments")
      .populate("consultations")
      .populate("prescriptions")
      .populate("labReports")
      .populate("dispenses")
      .populate("inventoryChanges")
      .populate("patients")
      .populate("reports")
      .populate("invoices"); // ✅ corrected virtual

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
      "invoices", // ✅ corrected
    ];

    if (populate) {
      populate.split(",").forEach((mod) => {
        if (validModules.includes(mod)) query = query.populate(mod);
      });
    } else {
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
export const createStaff = async (req, res) => {
  try {
    const { email, phone, firstName, lastName, role, department, specialty, status } = req.body;

    if (!firstName || !role || !department) {
      return res.status(400).json({ message: "First name, role, and department are required." });
    }

    const existingStaff = await Staff.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingStaff) {
      return res.status(409).json({ message: "Staff with this email or phone already exists." });
    }

    const staff = new Staff({ firstName, lastName, role, department, email, phone, specialty, status });
    const createdStaff = await staff.save();
    res.status(201).json(createdStaff);
  } catch (err) {
    console.error("Error in createStaff:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `Duplicate value for field '${field}'.`, error: err.message });
    }
    res.status(400).json({ message: "Error creating staff", error: err.message });
  }
};

// ===== UPDATE staff =====
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone } = req.body;

    const existingStaff = await Staff.findById(id);
    if (!existingStaff) return res.status(404).json({ message: "Staff not found." });

    if (email || phone) {
      const conflict = await Staff.findOne({ $or: [{ email }, { phone }], _id: { $ne: id } });
      if (conflict) return res.status(409).json({ message: "Another staff member already uses this email or phone." });
    }

    const updatedStaff = await Staff.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    res.status(200).json({ message: "Staff updated successfully.", staff: updatedStaff });
  } catch (err) {
    console.error("Error in updateStaff:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ message: `Duplicate value for field '${field}'.`, error: err.message });
    }
    res.status(400).json({ message: "Error updating staff", error: err.message });
  }
};

// ===== DELETE staff =====
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ message: "Staff not found." });

    const hasDependencies = (await Promise.all([
      mongoose.model("Appointment").exists({ doctor: id }),
      mongoose.model("Consultation").exists({ staff: id }),
      mongoose.model("Prescription").exists({ doctor: id }),
      mongoose.model("LabReport").exists({ labTech: id }),
      mongoose.model("Inventory").exists({ addedBy: id }),
      mongoose.model("Patient").exists({ primaryDoctor: id }),
      mongoose.model("Invoice").exists({ createdBy: id }) // ✅ include invoices
    ])).some(Boolean);

    if (hasDependencies) return res.status(400).json({ message: "Cannot delete staff. Linked records exist." });

    await staff.deleteOne();
    res.status(200).json({ message: "✅ Staff deleted successfully.", deletedId: id });
  } catch (err) {
    console.error("Error in deleteStaff:", err);
    res.status(500).json({ message: "Error deleting staff", error: err.message });
  }
};
