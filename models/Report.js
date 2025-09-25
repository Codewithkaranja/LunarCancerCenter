// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g., patient, staff, billing
  dateRange: { type: String }, // e.g., "1 Nov - 30 Nov 2025"
  author: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);
