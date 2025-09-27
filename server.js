import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import appointmentRoutes from './routes/appointmentRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import patientRoutes from './routes/patientsRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import inventoryRoutes from './routes/inventoryRoutes.js'; // create this file

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
app.use('/api/billing', invoiceRoutes); // ✅ MOUNT INVOICE ROUTES
app.use('/api/inventory', inventoryRoutes);

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
