// ==========================
// controllers/authController.js
// ==========================
import Staff from "../models/Staff.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ==========================
// Helper: Generate JWT
// ==========================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d", // token valid for 7 days
  });
};

// ==========================
// Register a new user
// ==========================
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, role, department, email, phone, password } = req.body;

    // Validate required fields
    if (!firstName || !role || !department || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Check if email exists
    if (email) {
      const existingUser = await Staff.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use." });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff record
    const staff = await Staff.create({
      firstName,
      lastName,
      role,
      department,
      email,
      phone,
      password: hashedPassword,
    });

    // Return response
    res.status(201).json({
      _id: staff._id,
      name: `${staff.firstName} ${staff.lastName || ""}`,
      role: staff.role,
      token: generateToken(staff._id),
    });
  } catch (err) {
    console.error("❌ Error in registerUser:", err.message);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// ==========================
// Login user
// ==========================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required." });

    const user = await Staff.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    res.json({
      _id: user._id,
      name: `${user.firstName} ${user.lastName || ""}`,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("❌ Error in loginUser:", err.message);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// ==========================
// Get current logged-in user
// ==========================
export const getCurrentUser = async (req, res) => {
  try {
    const user = await Staff.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json(user);
  } catch (err) {
    console.error("❌ Error in getCurrentUser:", err.message);
    res.status(500).json({ message: "Unable to fetch user", error: err.message });
  }
};
