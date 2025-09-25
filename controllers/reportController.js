// controllers/reportController.js
const Report = require('../models/Report');
const { Parser } = require('json2csv'); // for export CSV

// Fetch reports with filters, sorting, pagination
exports.getReports = async (req, res) => {
  try {
    const {
      category,
      dateRange,
      department,
      staffMember,
      sortField = 'generatedAt',
      sortDirection = 'desc',
      page = 1,
      limit = 5,
    } = req.query;

    const query = {};
    if (category) query.type = category;

    // Optional: Filter by dateRange string or author/department if needed
    if (dateRange) query.dateRange = { $regex: dateRange, $options: 'i' };
    if (staffMember) query.author = { $regex: staffMember, $options: 'i' };
    if (department) query.department = { $regex: department, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(query)
      .sort({ [sortField]: sortDirection === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await Report.countDocuments(query);

    res.json({ reports, totalCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Generate new report
exports.generateReport = async (req, res) => {
  try {
    const { name, type, dateRange, format } = req.body;

    const newReport = new Report({
      name,
      type,
      dateRange,
      author: req.user?.name || 'Admin User', // assuming JWT auth
    });

    await newReport.save();

    res.status(201).json(newReport);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

// Export reports as CSV
exports.exportReports = async (req, res) => {
  try {
    const { category, dateRange, department } = req.query;
    const query = {};
    if (category) query.type = category;
    if (dateRange) query.dateRange = { $regex: dateRange, $options: 'i' };
    if (department) query.department = { $regex: department, $options: 'i' };

    const reports = await Report.find(query);

    const fields = ['name', 'type', 'dateRange', 'author', 'generatedAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(reports);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${category || 'reports'}_${new Date().toISOString().slice(0,10)}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export reports' });
  }
};
