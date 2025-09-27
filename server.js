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
import reportRoutes from './routes/reportRoutes.js'; // ✅ add report routes

import { notFound, errorHandler } from './middleware/errorMiddleware.js';
// ==========================
// Reports API Endpoints
// ==========================
// GET    /api/reports             -> fetch list of reports (with filters/pagination)
// GET    /api/reports/:id         -> fetch single report by ID
// POST   /api/reports             -> generate a new report (admin/cashier only)
// GET    /api/reports/export      -> export all reports as CSV (admin/cashier only)
// GET    /api/reports/:id/export  -> export single report as CSV (admin/cashier only)
// ==========================

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/billing', invoiceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reports', reportRoutes); // ✅ mount report routes

// Test route
app.get('/', (req, res) => res.send('Backend is running!'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('✅ MongoDB Connected...'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
