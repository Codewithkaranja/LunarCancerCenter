// ==========================
// server.js
// ==========================
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import appointmentRoutes from './routes/appointmentRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import patientRoutes from './routes/patientsRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import labReportRoutes from './routes/labReportRoutes.js';       // ✅ new
import consultationRoutes from './routes/consultationRoutes.js'; // ✅ new

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ==========================
// Routes
// ==========================
app.use('/api/appointments', appointmentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/billing', invoiceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

// ✅ New routes
app.use('/api/labreports', labReportRoutes);
app.use('/api/consultations', consultationRoutes);

// Test route
app.get('/', (req, res) => res.send('Backend is running!'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// ==========================
// MongoDB Connection
// ==========================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((conn) => {
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
