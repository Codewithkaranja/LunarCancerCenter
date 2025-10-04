// middleware/validateInvoiceQuery.js
export const validateInvoiceQuery = (req, res, next) => {
  let { page = 1, limit = 20, sortColumn = "date", sortDirection = "desc" } = req.query;

  // Force numeric pagination values
  req.query.page = Math.max(1, parseInt(page, 10));
  req.query.limit = Math.max(1, parseInt(limit, 10));

  // Whitelisted columns
  const allowedColumns = [
    "invoiceNumber",
    "patientName",
    "status",
    "date",
    "dueDate",
    "recordedTotal",
    "createdAt"
  ];
  if (!allowedColumns.includes(sortColumn)) sortColumn = "date";

  // Normalize direction
  sortDirection = sortDirection.toLowerCase() === "asc" ? "asc" : "desc";

  req.query.sortColumn = sortColumn;
  req.query.sortDirection = sortDirection;

  next();
};
