// ==========================
// patients.js (Upgraded & Optimized)
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
//let currentSort = { column: null, direction: 'asc' };
let currentSort = { column: "createdAt", direction: "desc" };

let userRole = 'doctor'; // Should come from auth
let totalCount = 0;
let currentUser = { role: 'admin' }; // <- set this dynamically from your app/session

//debugPermissions(); // ✅ Now safe


// ==============================
// patients.js (structure order)
// ==============================



// 2️⃣ Helper functions
// Custom Alert Helper
// --------------------------
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
// ✅ Success Alert Helper (Green Popup)
function showSuccessAlert(message) {
  // Create the container
  const alertBox = document.createElement("div");
  alertBox.className = "success-alert";
  alertBox.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(alertBox);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    alertBox.classList.add("fade-out");
    setTimeout(() => alertBox.remove(), 500);
  }, 3000);
}
function normalizeId(patient) {
  return patient.patientId; // ✅ backend ID
}

function displayPatientId(patient) {
  return patient.patientId || `PAT${String(patient._id).slice(-4).toUpperCase()}`;
}


// --------------------------
// Export CSV Function
// --------------------------
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

  // Build CSV string
  let csvContent =
    headers.join(",") +
    "\n" +
    rows.map(r => r.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");

  // Create downloadable file
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
// --------------------------
// Export PDF Function
// --------------------------
async function exportPDF() {
  if (!filteredPatients.length) {
    alert("No patients to export.");
    return;
  }

  // ✅ Use jsPDF (make sure it's loaded in your HTML)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4"); // landscape orientation

  // Title
  doc.setFontSize(16);
  doc.text("Patient List Report", 40, 40);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);

  // Define table headers
  const headers = [
    ["Patient ID", "Name", "Age", "Gender", "Diagnosis", "Stage", "Doctor", "Next Appointment", "Status"]
  ];

  // Build table data
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

  // ✅ Use autoTable plugin
  doc.autoTable({
    head: headers,
    body: rows,
    startY: 80,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [40, 167, 69] }, // green header
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  // Footer with page number
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 80, doc.internal.pageSize.height - 30);
  }

  // ✅ Save
  doc.save("patients_report.pdf");
}




// 4️⃣ 🧩 Add your missing setupEventListeners here:
// Event Listeners Setup
// --------------------------
function setupEventListeners() {
  const searchInput = document.getElementById("search-name");
  const diagnosisFilter = document.getElementById("filter-diagnosis");
  const statusFilter = document.getElementById("filter-status");
  const sortSelect = document.getElementById("sort-dropdown");

  searchInput?.addEventListener("input", handleSearch);
  diagnosisFilter?.addEventListener("change", loadPatients);
  statusFilter?.addEventListener("change", loadPatients);
  sortSelect?.addEventListener("change", (e) => handleSortDropdown(e.target.value));

  // Optional exports
  document.getElementById("export-csv")?.addEventListener("click", exportCSV);
  document.getElementById("export-pdf")?.addEventListener("click", exportPDF);
}

// 5️⃣ 🧩 Add viewPatient() right here, before attaching row listeners
// ======================
// VIEW Patient
// ======================
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

// ======================
// ==========================
// Edit Patient (Load into Modal)
// ==========================
async function editPatient(patientId) {
  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message || "Patient not found");
    const p = data.patient;

    // 🧩 Fill modal fields safely
    document.getElementById("edit-patientId").value = p.patientId || "";
    document.getElementById("first-name").value = p.firstName || "";
    document.getElementById("last-name").value = p.lastName || "";
    document.getElementById("dob").value = p.dob ? p.dob.split("T")[0] : "";
    document.getElementById("gender").value = p.gender || "";
    document.getElementById("phone").value = p.phone || "";
    document.getElementById("email").value = p.email || "";
    document.getElementById("address").value = p.address || "";

    document.getElementById("diagnosis").value = p.diagnosis || "";
    document.getElementById("diagnosis-date").value = p.diagnosisDate
      ? p.diagnosisDate.split("T")[0]
      : "";
    document.getElementById("stage").value = p.stage || "";
    document.getElementById("treatment-plan").value = p.treatmentPlan || "";
    document.getElementById("allergies").value = p.allergies || "";
    document.getElementById("medical-history").value = p.medicalHistory || "";

    document.getElementById("insurance-provider").value = p.insuranceProvider || "";
    document.getElementById("insurance-id").value = p.insuranceId || "";
    document.getElementById("coverage").value = p.coverage || "";
    document.getElementById("valid-until").value = p.validUntil
      ? p.validUntil.split("T")[0]
      : "";

    document.getElementById("doctor").value = p.doctor || "";
    document.getElementById("status").value = p.status || "";
    document.getElementById("next-appointment").value = p.nextAppointment
      ? p.nextAppointment.split("T")[0]
      : "";

    // 🏷️ Update modal title and button text
    document.querySelector(".modal-title").textContent = "Edit Patient";
    const saveBtn = document.getElementById("savePatientBtn");
    saveBtn.textContent = "Update Patient";

    // ✅ Open the modal
    openModal();

  } catch (error) {
    console.error("❌ Error loading patient for edit:", error);
    showAlert("Failed to load patient for editing.", "error");
  }
}


// DELETE Patient
// ======================
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

    alert(`✅ Patient ${patientId} deleted successfully`);
    loadPatients(); // refresh list
  } catch (err) {
    console.error("❌ Error deleting patient:", err);
    alert("Failed to delete patient.");
  }
}
// 1️⃣ Render patients (function declaration)
function renderPatients() {
  const tbody = document.querySelector('.patients-table tbody');
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
    const backendId = patient.patientId || normalizeId(patient);
    const displayId = patient.patientId || `PAT${String(patient._id).slice(-4).toUpperCase()}`;
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
    ].join(' ');

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

// 2️⃣ Event delegation (single listener for tbody)
document.querySelector('.patients-table tbody').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const patientId = btn.dataset.id;
  if (!patientId) return;

  if (btn.classList.contains('btn-view')) viewPatient(patientId);
  else if (btn.classList.contains('btn-edit')) editPatient(patientId);
  else if (btn.classList.contains('btn-delete')) {
    if (confirm('Are you sure you want to delete this patient?')) {
      deletePatient(patientId).then(() => {
        filteredPatients = filteredPatients.filter(p => p.patientId !== patientId);
        renderPatients();
      });
    }
  } else if (btn.classList.contains('btn-prescription')) handlePrescription(patientId);
  else if (btn.classList.contains('btn-billing')) handleBilling(patientId);
});

// 3️⃣ Optional: keep attachRowListeners for clarity or legacy code
function attachRowListeners() {
  // now not strictly necessary because of event delegation
}


// 7️⃣ Main init call
document.addEventListener('DOMContentLoaded', () => {
  loadPatients();
  setupEventListeners(); // ✅ now defined
  applyRBAC();
});

// --------------------------
// RBAC Configuration
// --------------------------
const rbacConfig = {
  doctor: {
    can: ['view_patients','add_patients','edit_patients','view_prescriptions','edit_prescriptions','view_billing','export_data','manage_all']
  },
  nurse: {
    can: ['view_patients','add_patients','edit_patients','view_prescriptions']
  },
  admin: {
    can: ['view_patients','add_patients','edit_patients','delete_patients','view_prescriptions','view_billing','export_data','manage_all']
  },
  pharmacist: {
    can: ['view_patients','view_prescriptions','edit_prescriptions']
  }
};


// --------------------------
// Utilities
// --------------------------
//const checkPermission = (action) => rbacConfig[userRole]?.can.includes(action) || false;
// Updated permission checker
const checkPermission = (action) => {
  if (!currentUser || !currentUser.role) return false;
  const rolePermissions = rbacConfig[currentUser.role]?.can || [];
  return rolePermissions.includes(action);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date) ? 'N/A' : date.toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' });
};

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const generatePatientId = () => {
  const numericIds = allPatients.map(p => {
    const match = (p.id || p._id || "").match(/\d+$/);
    return match ? parseInt(match[0], 10) : null;
  }).filter(n => n !== null);
  const maxId = numericIds.length ? Math.max(...numericIds) : 0;
  return `PAT${String(maxId + 1).padStart(4, '0')}`;
};

//const normalizeId = (patient) => patient._id;
//const normalizeId = (patient) => patient.patientId;

//const displayPatientId = (patient) => patient.patientId || `PAT${String(patient._id).slice(-4).toUpperCase()}`;

// --------------------------
// Initialization
// --------------------------


// --------------------------
// Fetch & Render
// --------------------------
const loadPatients = async (page = currentPage) => {
  // Read filters and search inputs safely
  const searchText = document.getElementById("search-name")?.value.trim().toLowerCase() || "";
  const diagnosisFilter = document.getElementById("filter-diagnosis")?.value || "";
  const statusFilter = document.getElementById("filter-status")?.value || "";

  // Keep current sort state defaults
  const sortColumn = currentSort?.column || "createdAt";
  const sortDirection = currentSort?.direction || "desc";

  // Query parameters
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
    const res = await fetch(`${API_BASE}/api/patients?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch patients: ${res.status}`);

    const data = await res.json();

    // Handle flexible backend responses
    allPatients = Array.isArray(data.patients) ? data.patients : [];
    filteredPatients = [...allPatients];
    totalCount = data.totalCount ?? allPatients.length;
    currentPage = data.page ?? page;


    // Render results
    renderPatients();
    renderPagination(currentPage, data.totalPages ?? 1, totalCount);
  } catch (err) {
    console.error("Error loading patients:", err);

    // Safe fallback (empty table)
    allPatients = [];
    filteredPatients = [];
    totalCount = 0;

    renderPatients();
    renderPagination(1, 1, 0);
    showAlert("⚠️ Failed to load patients. Please try again later.", "error");
  }
};
// Debug RBAC for current user
function debugPermissions() {
  if (!currentUser || !currentUser.role) {
    console.warn("No current user or role set!");
    return;
  }

  const role = currentUser.role.toLowerCase(); // normalize
  const perms = rbacConfig[role]?.can || [];
  
  console.log(`Current user role: ${currentUser.role}`);
  console.log("Permissions available:", perms);

  // Quick check if delete_patients is allowed
  if (perms.includes('delete_patients')) {
    console.log("✅ User CAN delete patients (trash icon should show)");
  } else {
    console.log("❌ User CANNOT delete patients (trash icon hidden)");
  }
}

// Call it right after currentUser is set
debugPermissions();

// --------------------------
// Render Patients Table
// --------------------------




// --------------------------
// Pagination
// --------------------------
const renderPagination = (current, totalPages, totalCount) => {
  const container = document.getElementById("pagination");
  const info = document.getElementById("pagination-info");
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

// --------------------------
// Search & Sort
// --------------------------
let searchTimeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage = 1; loadPatients(); }, 300);
};

const applySort = (field, direction) => { currentSort = { column: field, direction }; loadPatients(currentPage); };

const handleSort = (column) => {
  const map = { 'Patient ID':'id','Name':'lastName','Age/Gender':'age','Diagnosis':'diagnosis','Stage':'stage','Doctor':'doctor','Next Appointment':'nextAppointment','Status':'status','Created At':'createdAt' };
  const field = map[column]; if (!field) return;
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

// --------------------------
// Row actions
// --------------------------
/*const attachRowListeners = () => {
  document.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => viewPatient(btn.dataset.id)));
  document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editPatient(btn.dataset.id)));
  document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deletePatient(btn.dataset.id)));
  document.querySelectorAll('.btn-prescription').forEach(btn => btn.addEventListener('click', () => handlePrescription(btn.dataset.id)));
  document.querySelectorAll('.btn-billing').forEach(btn => btn.addEventListener('click', () => handleBilling(btn.dataset.id)));
};*/

// --------------------------
// Navigation
// --------------------------
const handlePrescription = (id) => window.location.href = `pharmacy.html?patientId=${id}`;
const handleBilling = (id) => window.location.href = `invoice.html?patientId=${id}`;

// --------------------------
// Modal
// --------------------------
const openModal = () => {
  document.getElementById('patientModal').style.display = 'block';
};

const closeModal = () => {
  document.getElementById('patientModal').style.display = 'none';
  resetForm();
};

const resetForm = () => {
  // Clear hidden patient ID (for new entries)
  document.getElementById("edit-patientId").value = "";

  // Reset modal title
  document.querySelector('.modal-title').textContent = 'Add New Patient';

  // Reset tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('personal')?.classList.add('active');
  document.querySelector('[onclick="openTab(event, \'personal\')"]')?.classList.add('active');

  // Clear all input fields, selects, and textareas
  document.querySelectorAll('#patientModal input, #patientModal select, #patientModal textarea')
    .forEach(f => f.value = '');
};


const openTab = (evt, tabName) => {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName)?.classList.add('active');
  evt.currentTarget.classList.add('active');
};

// --------------------------
// Save or Update Patient
// --------------------------
async function savePatient() {
  const patientId = document.getElementById("edit-patientId")?.value.trim();

  // Collect form data
  const formData = {
    patientId,
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
    doctor: document.getElementById("doctor")?.value.trim() || null,
    status: document.getElementById("status")?.value || "active",
    nextAppointment: document.getElementById("next-appointment")?.value || null,
  };

  // Validate required fields
  if (!formData.firstName || !formData.lastName || !formData.dob) {
    showAlert("Please fill in First Name, Last Name, and Date of Birth.", "error");
    return;
  }

  // 🧩 Log what’s being sent (debug)
  console.log("Saving patient with data:", formData);

  try {
    const method = patientId ? "PUT" : "POST";
    const endpoint = patientId
      ? `${API_BASE}/api/patients/${patientId}`
      : `${API_BASE}/api/patients`;

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    console.log("Server response:", data); // 🧩 For debugging

    if (res.ok && data.success) {
      showAlert(
        patientId
          ? "✅ Patient updated successfully!"
          : "✅ Patient added successfully!",
        "success"
      );
      closeModal();
      loadPatients();
    } else {
      console.error("Server error:", data);
      showAlert(data.message || "Failed to save patient.", "error");
    }
  } catch (err) {
    console.error("Save error:", err);
    showAlert("⚠️ Error: Unable to save patient.", "error");
  }
}


// --------------------------

// --------------------------
// RBAC
// --------------------------
const applyRBAC = () => {
  if (!checkPermission('add_patients')) document.getElementById('add-patient-btn')?.remove();
  if (!checkPermission('export_data')) {
    document.getElementById('export-csv')?.remove();
    document.getElementById('export-pdf')?.remove();
  }
};
document.addEventListener("click", (e) => {
  if (e.target.closest("#logoutBtn")) {
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "index.html";
  }
});
