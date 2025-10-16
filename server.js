// ==========================
// server.js
// ==========================
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import appointmentRoutes from "./routes/appointmentRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import patientRoutes from "./routes/patientsRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import labReportRoutes from "./routes/labReportRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// ==========================
// Load environment variables
// ==========================
dotenv.config();

// ==========================
// Initialize Express
// ==========================
const app = express();

// ==========================
// Middleware
// ==========================
app.use(express.json());

// ==========================
// CORS Configuration
// ==========================

// 🔹 Allow these origins (for safety)
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://lunar-hmis-frontend.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin (Thunder Client, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ==========================
// Routes
// ==========================
app.use("/api/appointments", appointmentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/billing", invoiceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/labreports", labReportRoutes);
app.use("/api/consultations", consultationRoutes);

// ==========================
// Root Route
// ==========================
app.get("/", (req, res) => {
  res.send("✅ Lunar HMIS Backend is running successfully!");
});

// ==========================
// Error Handling Middleware
// ==========================
app.use(notFound);
app.use(errorHandler);

// ==========================
// MongoDB Connection
// ==========================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then((conn) => {
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
