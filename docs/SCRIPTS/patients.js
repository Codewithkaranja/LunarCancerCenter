// ==========================
// patients.js (Rewritten & Fixed)
// ==========================

// Base API URL
const API_BASE = "https://lunar-hmis-backend.onrender.com";

// --------------------------
// Global state
// --------------------------
let currentPage = 1;
const patientsPerPage = 5;
let allPatients = [];
let filteredPatients = [];
let currentSort = { column: "createdAt", direction: "desc" };
let userRole = 'doctor';
let totalCount = 0;
let currentUser = null;

// --------------------------
// RBAC Configuration
// --------------------------
const rbacConfig = {
  doctor: {
    can: ['view_patients', 'add_patients', 'edit_patients', 'view_prescriptions', 'edit_prescriptions', 'view_billing', 'export_data', 'manage_all']
  },
  nurse: {
    can: ['view_patients', 'add_patients', 'edit_patients', 'view_prescriptions']
  },
  admin: {
    can: ['view_patients', 'add_patients', 'edit_patients', 'delete_patients', 'view_prescriptions', 'view_billing', 'export_data', 'manage_all']
  },
  pharmacist: {
    can: ['view_patients', 'view_prescriptions', 'edit_prescriptions']
  }
};

// ==========================
// Initialization Functions
// ==========================

// Initialize current user
function initializeCurrentUser() {
  // Try to get user from localStorage/sessionStorage
  const userData = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
  if (userData) {
    currentUser = JSON.parse(userData);
  } else {
    // Fallback for demo - remove in production
    currentUser = { role: 'admin', userId: 'demo' };
    console.warn('No user data found, using demo admin role');
  }
  userRole = currentUser.role;
  debugPermissions();
}

// Debug current user and permissions
function debugCurrentUser() {
  console.log('🔍 Current User Debug:');
  console.log('- currentUser:', currentUser);
  console.log('- userRole:', userRole);
  console.log('- Permissions for role:', rbacConfig[currentUser.role]?.can);
}

// Debug permissions
function debugPermissions() {
  if (!currentUser || !currentUser.role) {
    console.warn("No current user or role set!");
    return;
  }

  const role = currentUser.role.toLowerCase();
  const perms = rbacConfig[role]?.can || [];
  
  console.log(`Current user role: ${currentUser.role}`);
  console.log("Permissions available:", perms);

  if (perms.includes('delete_patients')) {
    console.log("✅ User CAN delete patients (trash icon should show)");
  } else {
    console.log("❌ User CANNOT delete patients (trash icon hidden)");
  }
}

// ==========================
// Utility Functions
// ==========================

// Permission checker
const checkPermission = (action) => {
  if (!currentUser || !currentUser.role) return false;
  const rolePermissions = rbacConfig[currentUser.role]?.can || [];
  return rolePermissions.includes(action);
};

// Date formatting
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return isNaN(date) ? 'N/A' : date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Age calculation
const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// ID normalization
function normalizeId(patient) {
  return patient.patientId || patient._id;
}

// Display patient ID
function displayPatientId(patient) {
  return patient.patientId || `PAT${String(patient._id).slice(-4).toUpperCase()}`;
}

// Generate new patient ID
const generatePatientId = () => {
  const numericIds = allPatients.map(p => {
    const match = (p.patientId || "").match(/\d+$/);
    return match ? parseInt(match[0], 10) : null;
  }).filter(n => n !== null);
  const maxId = numericIds.length ? Math.max(...numericIds) : 0;
  return `PAT${String(maxId + 1).padStart(4, '0')}`;
};

// ==========================
// Alert & Notification Functions
// ==========================

// Custom Alert Helper
function showAlert(message, type = "success") {
  const alertBox = document.createElement("div");
  alertBox.className = `custom-alert ${type}`;
  alertBox.innerHTML = `<span>${message}</span>`;

  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.classList.add("visible");
  }, 50);

  setTimeout(() => {
    alertBox.classList.remove("visible");
    setTimeout(() => alertBox.remove(), 300);
  }, 3000);
}

// Success Alert Helper
function showSuccessAlert(message) {
  const alertBox = document.createElement("div");
  alertBox.className = "success-alert";
  alertBox.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.classList.add("fade-out");
    setTimeout(() => alertBox.remove(), 500);
  }, 3000);
}

// ==========================
// Data Loading Functions
// ==========================

// Load patients with improved error handling
const loadPatients = async (page = currentPage) => {
  const searchText = document.getElementById("search-name")?.value.trim().toLowerCase() || "";
  const diagnosisFilter = document.getElementById("filter-diagnosis")?.value || "";
  const statusFilter = document.getElementById("filter-status")?.value || "";

  const sortColumn = currentSort?.column || "createdAt";
  const sortDirection = currentSort?.direction || "desc";

  const query = new URLSearchParams({
    search: searchText,
    diagnosis: diagnosisFilter,
    status: statusFilter,
    sortColumn,
    sortDirection,
    page,
    limit: patientsPerPage
  });

  try {
    console.log('Fetching patients from:', `${API_BASE}/api/patients?${query.toString()}`);
    
    const res = await fetch(`${API_BASE}/api/patients?${query.toString()}`);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    console.log('Patients API response:', data);

    // Handle different possible response structures
    if (data.patients) {
      allPatients = Array.isArray(data.patients) ? data.patients : [];
    } else if (Array.isArray(data)) {
      allPatients = data;
    } else {
      allPatients = [];
    }

    filteredPatients = [...allPatients];
    totalCount = data.totalCount || data.count || allPatients.length;
    currentPage = data.page || page;

    renderPatients();
    
    const totalPages = data.totalPages || Math.ceil(totalCount / patientsPerPage) || 1;
    renderPagination(currentPage, totalPages, totalCount);

  } catch (err) {
    console.error("Error loading patients:", err);
    
    allPatients = [];
    filteredPatients = [];
    totalCount = 0;

    renderPatients();
    renderPagination(1, 1, 0);
    showAlert("⚠️ Failed to load patients: " + err.message, "error");
  }
};

// Load doctors into dropdown
async function loadStaffList(selectedDoctorId = null) {
  try {
    console.log('Loading staff list...');
    const res = await fetch(`${API_BASE}/api/staff`);
    console.log("Staff fetch status:", res.status, res.statusText);

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const data = await res.json();
    if (!data.success) throw new Error("API responded with failure");

    const staffSelect = document.getElementById("doctor");
    if (!staffSelect) {
      console.error("Doctor select element not found");
      return;
    }

    staffSelect.innerHTML = `<option value="">-- Select Doctor --</option>`;

    const doctors = data.staff.filter(s => s.role === "doctor");
    console.log(`Found ${doctors.length} doctors`);

    doctors.forEach(doc => {
      const option = document.createElement("option");
      option.value = doc._id;
      option.textContent = `${doc.firstName} ${doc.lastName}`;
      if (selectedDoctorId && doc._id === selectedDoctorId) {
        option.selected = true;
      }
      staffSelect.appendChild(option);
    });

    if (doctors.length === 0) {
      staffSelect.innerHTML = `<option value="">No doctors available</option>`;
    }

  } catch (err) {
    console.error("❌ Error loading staff list:", err);
    showAlert("⚠️ Failed to load staff members.", "error");
  }
}

// ==========================
// Rendering Functions
// ==========================

// Render patients table
function renderPatients() {
  const tbody = document.querySelector('.patients-table tbody');
  if (!tbody) {
    console.error('Patients table tbody not found');
    return;
  }

  tbody.innerHTML = '';

  if (!filteredPatients || filteredPatients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center no-data">No patients found.</td>
      </tr>
    `;
    return;
  }

  filteredPatients.forEach(patient => {
    const backendId = normalizeId(patient);
    const displayId = displayPatientId(patient);
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unnamed';
    const ageGender = patient.dob
      ? `${calculateAge(patient.dob)} / ${patient.gender || 'N/A'}`
      : patient.gender || 'N/A';
    const statusClass = `status-${patient.status || 'unknown'}`;
    const statusText = patient.status
      ? patient.status[0].toUpperCase() + patient.status.slice(1)
      : 'N/A';

    const actions = [
      checkPermission('view_patients') ? `<button class="action-btn btn-view" data-id="${backendId}" title="View Patient"><i class="fas fa-eye"></i></button>` : '',
      checkPermission('edit_patients') ? `<button class="action-btn btn-edit" data-id="${backendId}" title="Edit Patient"><i class="fas fa-edit"></i></button>` : '',
      checkPermission('delete_patients') ? `<button class="action-btn btn-delete" data-id="${backendId}" title="Delete Patient"><i class="fas fa-trash"></i></button>` : '',
      checkPermission('view_prescriptions') ? `<button class="action-btn btn-prescription" data-id="${backendId}" title="View Prescriptions"><i class="fas fa-prescription-bottle-alt"></i></button>` : '',
      checkPermission('view_billing') ? `<button class="action-btn btn-billing" data-id="${backendId}" title="View Billing"><i class="fas fa-file-invoice"></i></button>` : '',
    ].filter(Boolean).join(' ');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${displayId}</td>
      <td>${fullName}</td>
      <td>${ageGender}</td>
      <td>${patient.diagnosis || 'N/A'}</td>
      <td>${patient.stage || 'N/A'}</td>
      <td>${patient.doctor || 'N/A'}</td>
      <td>${formatDate(patient.nextAppointment)}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td class="action-cell">${actions}</td>
    `;
    tbody.appendChild(row);
  });
}

// Render pagination
const renderPagination = (current, totalPages, totalCount) => {
  const container = document.getElementById("pagination");
  const info = document.getElementById("pagination-info");
  
  if (!container || !info) {
    console.error('Pagination elements not found');
    return;
  }

  info.textContent = totalCount > 0
    ? `Showing ${(current-1)*patientsPerPage+1}-${Math.min(current*patientsPerPage,totalCount)} of ${totalCount} patients`
    : "No patients found";

  if (totalPages <= 1) { container.innerHTML = ''; return; }

  const maxVisible = 5;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  let html = `<button class="pagination-btn prev-btn ${current===1?'disabled':''}">&laquo; Previous</button>`;
  if (start > 1) html += `<button class="pagination-btn page-btn" data-page="1">1</button><span class="ellipsis">...</span>`;
  for (let i = start; i <= end; i++) html += `<button class="pagination-btn page-btn ${i===current?'active':''}" data-page="${i}">${i}</button>`;
  if (end < totalPages) html += `<span class="ellipsis">...</span><button class="pagination-btn page-btn" data-page="${totalPages}">${totalPages}</button>`;
  html += `<button class="pagination-btn next-btn ${current===totalPages?'disabled':''}">Next &raquo;</button>`;

  container.innerHTML = html;

  container.querySelector(".prev-btn")?.addEventListener("click", () => { if (current > 1) loadPatients(current - 1); });
  container.querySelectorAll(".page-btn").forEach(btn => btn.addEventListener("click", () => { const p = parseInt(btn.dataset.page, 10); if (p !== current) loadPatients(p); }));
  container.querySelector(".next-btn")?.addEventListener("click", () => { if (current < totalPages) loadPatients(current + 1); });
};

// ==========================
// Event Handlers
// ==========================

// Search handler
let searchTimeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage = 1; loadPatients(); }, 300);
};

// Sort handlers
const applySort = (field, direction) => { 
  currentSort = { column: field, direction }; 
  loadPatients(currentPage); 
};

const handleSort = (column) => {
  const map = { 
    'Patient ID': 'patientId', 
    'Name': 'lastName', 
    'Age/Gender': 'dob', 
    'Diagnosis': 'diagnosis', 
    'Stage': 'stage', 
    'Doctor': 'doctor', 
    'Next Appointment': 'nextAppointment', 
    'Status': 'status', 
    'Created At': 'createdAt' 
  };
  const field = map[column]; 
  if (!field) return;
  const direction = currentSort.column === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
  applySort(field, direction);
};

const handleSortDropdown = (value) => {
  const map = {
    'Sort by: Newest First': { field: 'createdAt', direction: 'desc' },
    'Sort by: Oldest First': { field: 'createdAt', direction: 'asc' },
    'Sort by: Name A-Z': { field: 'lastName', direction: 'asc' },
    'Sort by: Name Z-A': { field: 'lastName', direction: 'desc' },
    'Sort by: Patient ID': { field: 'patientId', direction: 'asc' }
  };

  const sortConfig = map[value];
  if (!sortConfig) return;

  currentSort = { column: sortConfig.field, direction: sortConfig.direction };
  loadPatients(1);
};

// Row action handlers using event delegation
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const patientId = btn.dataset.id;
  if (!patientId) return;

  if (btn.classList.contains('btn-view')) viewPatient(patientId);
  else if (btn.classList.contains('btn-edit')) editPatient(patientId);
  else if (btn.classList.contains('btn-delete')) {
    if (confirm('Are you sure you want to delete this patient?')) {
      deletePatient(patientId).then(() => {
        filteredPatients = filteredPatients.filter(p => normalizeId(p) !== patientId);
        renderPatients();
      });
    }
  } else if (btn.classList.contains('btn-prescription')) handlePrescription(patientId);
  else if (btn.classList.contains('btn-billing')) handleBilling(patientId);
});

// Navigation handlers
const handlePrescription = (id) => window.location.href = `pharmacy.html?patientId=${id}`;
const handleBilling = (id) => window.location.href = `invoice.html?patientId=${id}`;

// ==========================
// Patient CRUD Operations
// ==========================

// View patient details
async function viewPatient(patientId) {
  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || "Patient not found");
      return;
    }

    const p = data.patient;
    alert(
      `👤 Viewing Patient Details\n` +
      `Name: ${p.firstName} ${p.lastName}\n` +
      `Patient ID: ${p.patientId}\n` +
      `Gender: ${p.gender}\n` +
      `Diagnosis: ${p.diagnosis || "N/A"}\n` +
      `Stage: ${p.stage || "N/A"}\n` +
      `Doctor: ${p.doctor || "N/A"}`
    );
  } catch (err) {
    console.error("❌ Error fetching patient:", err);
    alert("Failed to fetch patient data.");
  }
}

// Edit patient modal
async function editPatient(patientId) {
  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message || "Patient not found");
    const p = data.patient;

    // Load doctors first, pre-select patient's doctor
    await loadStaffList(p.doctor || null);

    // Fill patient form
    document.getElementById("edit-patientId").value = p.patientId || "";
    document.getElementById("first-name").value = p.firstName || "";
    document.getElementById("last-name").value = p.lastName || "";
    document.getElementById("dob").value = p.dob ? p.dob.split("T")[0] : "";
    document.getElementById("gender").value = p.gender || "";
    document.getElementById("phone").value = p.phone || "";
    document.getElementById("email").value = p.email || "";
    document.getElementById("address").value = p.address || "";
    document.getElementById("diagnosis").value = p.diagnosis || "";
    document.getElementById("diagnosis-date").value = p.diagnosisDate ? p.diagnosisDate.split("T")[0] : "";
    document.getElementById("stage").value = p.stage || "";
    document.getElementById("treatment-plan").value = p.treatmentPlan || "";
    document.getElementById("allergies").value = p.allergies || "";
    document.getElementById("medical-history").value = p.medicalHistory || "";
    document.getElementById("insurance-provider").value = p.insuranceProvider || "";
    document.getElementById("insurance-id").value = p.insuranceId || "";
    document.getElementById("coverage").value = p.coverage || "";
    document.getElementById("valid-until").value = p.validUntil ? p.validUntil.split("T")[0] : "";
    document.getElementById("status").value = p.status || "";
    document.getElementById("next-appointment").value = p.nextAppointment ? p.nextAppointment.split("T")[0] : "";

    document.querySelector(".modal-title").textContent = "Edit Patient";
    document.getElementById("savePatientBtn").textContent = "Update Patient";

    openModal();

  } catch (err) {
    console.error("❌ Error loading patient for edit:", err);
    showAlert("Failed to load patient for editing.", "error");
  }
}

// Delete patient
async function deletePatient(patientId) {
  if (!confirm(`Are you sure you want to delete patient ${patientId}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || "Failed to delete patient");
      return;
    }

    showAlert(`✅ Patient ${patientId} deleted successfully`, "success");
    loadPatients();
  } catch (err) {
    console.error("❌ Error deleting patient:", err);
    showAlert("Failed to delete patient.", "error");
  }
}

// Save or update patient
async function savePatient() {
  const patientId = document.getElementById("edit-patientId")?.value;

  const formData = {
    patientId: patientId || generatePatientId(),
    firstName: document.getElementById("first-name")?.value.trim(),
    lastName: document.getElementById("last-name")?.value.trim(),
    dob: document.getElementById("dob")?.value || null,
    gender: document.getElementById("gender")?.value,
    phone: document.getElementById("phone")?.value.trim(),
    email: document.getElementById("email")?.value.trim(),
    address: document.getElementById("address")?.value.trim(),
    diagnosis: document.getElementById("diagnosis")?.value.trim(),
    diagnosisDate: document.getElementById("diagnosis-date")?.value || null,
    stage: document.getElementById("stage")?.value.trim(),
    treatmentPlan: document.getElementById("treatment-plan")?.value.trim(),
    allergies: document.getElementById("allergies")?.value.trim(),
    medicalHistory: document.getElementById("medical-history")?.value.trim(),
    insuranceProvider: document.getElementById("insurance-provider")?.value.trim(),
    insuranceId: document.getElementById("insurance-id")?.value.trim(),
    coverage: document.getElementById("coverage")?.value.trim(),
    validUntil: document.getElementById("valid-until")?.value || null,
    doctor: document.getElementById("doctor")?.value || null,
    status: document.getElementById("status")?.value || "active",
    nextAppointment: document.getElementById("next-appointment")?.value || null,
  };

  if (!formData.firstName || !formData.lastName || !formData.dob) {
    showAlert("Please fill in First Name, Last Name, and Date of Birth.", "error");
    return;
  }

  console.log("Submitting patient data:", formData);

  try {
    const method = patientId ? "PUT" : "POST";
    const url = patientId
      ? `${API_BASE}/api/patients/${patientId}`
      : `${API_BASE}/api/patients`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    console.log("Server response:", data);

    if (res.ok && data.success) {
      showAlert(patientId ? "✅ Patient updated successfully!" : "✅ Patient added successfully!", "success");
      closeModal();
      loadPatients();
    } else {
      console.error("Server error:", data);
      showAlert(data.message || "Failed to save patient.", "error");
    }

  } catch (err) {
    console.error("❌ Save error:", err);
    showAlert("⚠️ Unable to save patient.", "error");
  }
}

// ==========================
// Modal Functions
// ==========================

// Open modal for new patient
function openAddPatientModal() {
  resetForm();
  document.querySelector('.modal-title').textContent = 'Add New Patient';
  document.getElementById('savePatientBtn').textContent = 'Add Patient';
  
  // Load doctors when opening modal for new patient
  loadStaffList().then(() => {
    openModal();
  });
}

// Open modal
const openModal = () => {
  document.getElementById('patientModal').style.display = 'block';
};

// Close modal
const closeModal = () => {
  document.getElementById('patientModal').style.display = 'none';
  resetForm();
};

// Reset form
const resetForm = () => {
  document.getElementById("edit-patientId").value = "";
  document.querySelector('.modal-title').textContent = 'Add New Patient';
  document.getElementById('savePatientBtn').textContent = 'Add Patient';

  // Reset tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('personal')?.classList.add('active');
  document.querySelector('[onclick="openTab(event, \'personal\')"]')?.classList.add('active');

  // Clear all input fields
  document.querySelectorAll('#patientModal input, #patientModal select, #patientModal textarea')
    .forEach(f => f.value = '');
};

// Tab navigation
const openTab = (evt, tabName) => {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName)?.classList.add('active');
  evt.currentTarget.classList.add('active');
};

// ==========================
// Export Functions
// ==========================

// Export CSV
function exportCSV() {
  if (!filteredPatients.length) {
    alert("No patients to export.");
    return;
  }

  const headers = [
    "Patient ID",
    "Name",
    "Age",
    "Gender",
    "Diagnosis",
    "Stage",
    "Doctor",
    "Next Appointment",
    "Status"
  ];

  const rows = filteredPatients.map(p => [
    displayPatientId(p),
    `${p.firstName} ${p.lastName}`,
    calculateAge(p.dob),
    p.gender || "N/A",
    p.diagnosis || "N/A",
    p.stage || "N/A",
    p.doctor || "N/A",
    formatDate(p.nextAppointment),
    p.status || "N/A"
  ]);

  let csvContent =
    headers.join(",") +
    "\n" +
    rows.map(r => r.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "patients_export.csv");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export PDF
async function exportPDF() {
  if (!filteredPatients.length) {
    alert("No patients to export.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4");

  doc.setFontSize(16);
  doc.text("Patient List Report", 40, 40);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);

  const headers = [
    ["Patient ID", "Name", "Age", "Gender", "Diagnosis", "Stage", "Doctor", "Next Appointment", "Status"]
  ];

  const rows = filteredPatients.map(p => [
    displayPatientId(p),
    `${p.firstName} ${p.lastName}`,
    calculateAge(p.dob),
    p.gender || "N/A",
    p.diagnosis || "N/A",
    p.stage || "N/A",
    p.doctor || "N/A",
    formatDate(p.nextAppointment),
    p.status || "N/A"
  ]);

  doc.autoTable({
    head: headers,
    body: rows,
    startY: 80,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [40, 167, 69] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 30);
  }

  doc.save("patients_report.pdf");
}

// ==========================
// Event Listeners Setup
// ==========================

function setupEventListeners() {
  const searchInput = document.getElementById("search-name");
  const diagnosisFilter = document.getElementById("filter-diagnosis");
  const statusFilter = document.getElementById("filter-status");
  const sortSelect = document.getElementById("sort-dropdown");

  searchInput?.addEventListener("input", handleSearch);
  diagnosisFilter?.addEventListener("change", loadPatients);
  statusFilter?.addEventListener("change", loadPatients);
  sortSelect?.addEventListener("change", (e) => handleSortDropdown(e.target.value));

  // Export buttons
  document.getElementById("export-csv")?.addEventListener("click", exportCSV);
  document.getElementById("export-pdf")?.addEventListener("click", exportPDF);

  // Modal buttons
  document.getElementById("savePatientBtn")?.addEventListener("click", savePatient);
  document.querySelector(".close")?.addEventListener("click", closeModal);

  // Add patient button
  document.getElementById('add-patient-btn')?.addEventListener('click', openAddPatientModal);
}

// Apply RBAC
const applyRBAC = () => {
  if (!checkPermission('add_patients')) {
    document.getElementById('add-patient-btn')?.style.display = 'none';
  }
  if (!checkPermission('export_data')) {
    document.getElementById('export-csv')?.style.display = 'none';
    document.getElementById('export-pdf')?.style.display = 'none';
  }
};

// Logout handler
document.addEventListener("click", (e) => {
  if (e.target.closest("#logoutBtn")) {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    sessionStorage.clear();
    window.location.href = "index.html";
  }
});

// ==========================
// Main Initialization
// ==========================

document.addEventListener('DOMContentLoaded', () => {
  console.log('=== PATIENTS.JS INITIALIZED ===');
  
  initializeCurrentUser();
  debugCurrentUser();
  
  loadPatients();
  setupEventListeners();
  applyRBAC();
});

// API test function for debugging
async function debugLoadPatients() {
  try {
    const testRes = await fetch(`${API_BASE}/api/patients?limit=1`);
    console.log('API Test Response:', {
      status: testRes.status,
      statusText: testRes.statusText,
      body: await testRes.text()
    });
  } catch (err) {
    console.error('API Connection Failed:', err);
  }
}