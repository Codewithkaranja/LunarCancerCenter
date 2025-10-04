// Base API URL (point to your Render backend)
const API_BASE = "https://lunar-hmis-backend.onrender.com";


// Global variables
let currentPage = 1;
const patientsPerPage = 5;
let allPatients = [];
let filteredPatients = [];
let currentSort = { column: null, direction: 'asc' };
let userRole = 'doctor'; // This would typically come from your authentication system

// Sample patient data (in a real app, this would come from your backend)
const samplePatients = [
  {
    id: 'P12345',
    firstName: 'John',
    lastName: 'Doe',
    age: 42,
    gender: 'M',
    diagnosis: 'Lung Cancer',
    stage: 'Chemotherapy Cycle 2',
    doctor: 'Dr. Achieng',
    nextAppointment: '2025-11-22',
    status: 'active',
    phone: '+254712345678',
    email: 'john.doe@example.com',
    address: '123 Main St, Nairobi',
    diagnosisDate: '2025-09-15',
    treatmentPlan: 'chemo',
    allergies: 'None',
    medicalHistory: 'Hypertension',
    insuranceProvider: 'nhif',
    insuranceId: 'NHIF-12345',
    coverage: 'full',
    validUntil: '2024-12-31'
  },
  {
    id: 'P12346',
    firstName: 'Mary',
    lastName: 'Smith',
    age: 56,
    gender: 'F',
    diagnosis: 'Breast Cancer',
    stage: 'Radiotherapy Session 5',
    doctor: 'Dr. Kamau',
    nextAppointment: '2025-11-24',
    status: 'active',
    phone: '+254712345679',
    email: 'mary.smith@example.com',
    address: '456 Oak Ave, Mombasa',
    diagnosisDate: '2025-08-10',
    treatmentPlan: 'radio',
    allergies: 'Penicillin',
    medicalHistory: 'Diabetes Type 2',
    insuranceProvider: 'aaron',
    insuranceId: 'AAR-67890',
    coverage: 'partial',
    validUntil: '2024-06-30'
  },
  {
    id: 'P12347',
    firstName: 'Robert',
    lastName: 'Johnson',
    age: 61,
    gender: 'M',
    diagnosis: 'Prostate Cancer',
    stage: 'Post-Surgery Monitoring',
    doctor: 'Dr. Achieng',
    nextAppointment: '2025-11-25',
    status: 'active',
    phone: '+254712345680',
    email: 'robert.j@example.com',
    address: '789 Pine Rd, Kisumu',
    diagnosisDate: '2025-07-22',
    treatmentPlan: 'surgery',
    allergies: 'None',
    medicalHistory: 'High cholesterol',
    insuranceProvider: 'jubilee',
    insuranceId: 'JUB-11223',
    coverage: 'full',
    validUntil: '2024-09-15'
  },
  {
    id: 'P12348',
    firstName: 'Susan',
    lastName: 'Wangari',
    age: 38,
    gender: 'F',
    diagnosis: 'Leukemia',
    stage: 'Chemotherapy Cycle 1',
    doctor: 'Dr. Nyong\'o',
    nextAppointment: '2025-11-20',
    status: 'active',
    phone: '+254712345681',
    email: 'susan.w@example.com',
    address: '321 Elm St, Nakuru',
    diagnosisDate: '2025-10-05',
    treatmentPlan: 'chemo',
    allergies: 'Shellfish, Iodine',
    medicalHistory: 'Asthma',
    insuranceProvider: 'cici',
    insuranceId: 'CIC-44556',
    coverage: 'copay',
    validUntil: '2024-03-31'
  },
  {
    id: 'P12349',
    firstName: 'James',
    lastName: 'Ochieng',
    age: 50,
    gender: 'M',
    diagnosis: 'Colorectal Cancer',
    stage: 'Pre-Surgery Evaluation',
    doctor: 'Dr. Kamau',
    nextAppointment: '2025-11-18',
    status: 'pending',
    phone: '+254712345682',
    email: 'james.o@example.com',
    address: '654 Cedar Ln, Eldoret',
    diagnosisDate: '2025-11-01',
    treatmentPlan: 'surgery',
    allergies: 'Latex',
    medicalHistory: 'Ulcerative colitis',
    insuranceProvider: 'nhif',
    insuranceId: 'NHIF-77889',
    coverage: 'partial',
    validUntil: '2024-08-20'
  },
  // Additional sample patients for pagination testing
  {
    id: 'P12350',
    firstName: 'Grace',
    lastName: 'Wambui',
    age: 45,
    gender: 'F',
    diagnosis: 'Breast Cancer',
    stage: 'Chemotherapy Cycle 3',
    doctor: 'Dr. Achieng',
    nextAppointment: '2025-11-28',
    status: 'active',
    phone: '+254712345683',
    email: 'grace.w@example.com',
    address: '987 Maple Dr, Thika',
    diagnosisDate: '2025-06-15',
    treatmentPlan: 'chemo',
    allergies: 'None',
    medicalHistory: 'None',
    insuranceProvider: 'aaron',
    insuranceId: 'AAR-99001',
    coverage: 'full',
    validUntil: '2024-05-15'
  },
  {
    id: 'P12351',
    firstName: 'Daniel',
    lastName: 'Kipchoge',
    age: 55,
    gender: 'M',
    diagnosis: 'Lung Cancer',
    stage: 'Radiotherapy Session 2',
    doctor: 'Dr. Nyong\'o',
    nextAppointment: '2025-11-30',
    status: 'active',
    phone: '+254712345684',
    email: 'daniel.k@example.com',
    address: '147 Birch St, Nyeri',
    diagnosisDate: '2025-09-20',
    treatmentPlan: 'radio',
    allergies: 'Peanuts',
    medicalHistory: 'Hypertension',
    insuranceProvider: 'jubilee',
    insuranceId: 'JUB-22334',
    coverage: 'full',
    validUntil: '2024-07-31'
  }
];

// RBAC Configuration
const rbacConfig = {
  doctor: {
    can: ['view_patients', 'add_patients', 'edit_patients', 'view_prescriptions', 
          'edit_prescriptions', 'view_billing', 'export_data']
  },
  nurse: {
    can: ['view_patients', 'add_patients', 'edit_patients', 'view_prescriptions']
  },
  admin: {
    can: ['view_patients', 'add_patients', 'edit_patients', 'delete_patients', 
          'view_prescriptions', 'view_billing', 'export_data', 'manage_all']
  },
  pharmacist: {
    can: ['view_patients', 'view_prescriptions', 'edit_prescriptions']
  }
};

// Check user permissions
function checkPermission(action) {
  return rbacConfig[userRole]?.can.includes(action) || false;
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  initializePatients();
  setupEventListeners();
  applyRBAC();
});

// Initialize patient data
// Initialize patient data
/*async function initializePatients(page = 1, limit = 5) {
  try {
    const response = await fetch(`${API_BASE}/api/patients?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch patients");

    const data = await response.json();

    // ✅ Get patients array from backend
    allPatients = (data && data.patients && data.patients.length > 0)
      ? data.patients
      : [];

    filteredPatients = [...allPatients];

    renderPatients();
    updatePagination(data.page, data.pages, data.totalCount);
  } catch (error) {
    console.error("Error fetching patients:", error);

    // ❌ No more fallback to samplePatients
    allPatients = [];
    filteredPatients = [];

    renderPatients();
    updatePagination(1, 1, 0);
  }
}*/



// Set up event listeners
function setupEventListeners() {
  // Search button
  document.querySelector('.search-btn').addEventListener('click', handleSearch);
  
  // Search input enter key
  document.getElementById('search-name').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleSearch();
  });
  
  // Filter changes
  document.getElementById('filter-diagnosis').addEventListener('change', handleSearch);
  document.getElementById('filter-status').addEventListener('change', handleSearch);
  
  // Sort functionality
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.textContent.trim();
      handleSort(column);
    });
  });
  
  // Sort dropdown
  document.querySelector('.table-actions select').addEventListener('change', function(e) {
    handleSortDropdown(e.target.value);
  });
  
  // Export buttons
  document.querySelector('.btn-success').addEventListener('click', exportCSV);
  document.querySelector('.btn-warning').addEventListener('click', exportPDF);
  
  // Pagination buttons
  document.getElementById('pagination').addEventListener('click', function(e) {
    if (e.target.classList.contains('pagination-btn')) {
      handlePagination(e.target);
    }
  });
  
  // Modal form submission
  document.querySelector('.modal-body .btn-primary').addEventListener('click', savePatient);
}

// Apply RBAC restrictions
function applyRBAC() {
  // Show/hide buttons based on permissions
  if (!checkPermission('add_patients')) {
    document.querySelector('.btn-primary').style.display = 'none';
  }
  
  if (!checkPermission('export_data')) {
    document.querySelector('.btn-success').style.display = 'none';
    document.querySelector('.btn-warning').style.display = 'none';
  }
  
  // In a real application, you would also modify table actions based on permissions
}

// Handle search functionality
async function handleSearch() {
  const searchText = document.getElementById('search-name').value.toLowerCase();
  const diagnosisFilter = document.getElementById('filter-diagnosis').value;
  const statusFilter = document.getElementById('filter-status').value;

  currentPage = 1;

  const query = new URLSearchParams({
    search: searchText,
    diagnosis: diagnosisFilter,
    status: statusFilter,
    sortColumn: currentSort.column || '',
    sortDirection: currentSort.direction || 'asc',
    page: currentPage,
    limit: patientsPerPage
  });

  try {
    const response = await fetch(`${API_BASE}/api/patients?${query.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch filtered patients");
    const data = await response.json();

    filteredPatients = data.patients || [];
    totalCount = data.totalCount || filteredPatients.length;

    renderPatients();
    updatePagination(data.page || 1, data.totalPages || 1, totalCount);
  } catch (error) {
    console.error(error);
    alert("Search failed");
  }
}



// Handle sorting
// Sorting
function handleSort(column) {
  const map = {
    'Patient ID': 'id',
    'Name': 'lastName',
    'Age/Gender': 'age',
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
}

function handleSortDropdown(value) {
  const map = {
    'Sort by: Newest First': { field: 'createdAt', direction: 'desc' },
    'Sort by: Oldest First': { field: 'createdAt', direction: 'asc' },
    'Sort by: Name A-Z': { field: 'lastName', direction: 'asc' },
    'Sort by: Name Z-A': { field: 'lastName', direction: 'desc' },
    'Sort by: Patient ID': { field: 'id', direction: 'asc' }
  };
  const sortConfig = map[value];
  if (!sortConfig) return;

  applySort(sortConfig.field, sortConfig.direction);
}

function applySort(field, direction) {
  currentSort.column = field;
  currentSort.direction = direction;
  loadPatients(currentPage);
}



// Render patients table
/*function getPatientId(patient) {
  return patient.id || patient._id; // normalize frontend vs backend
}*/

function renderPatients(patients = filteredPatients) {
  const tbody = document.querySelector('.patients-table tbody');
  tbody.innerHTML = '';

  patients.forEach(patient => {
    const row = document.createElement('tr');
    const statusClass = `status-${patient.status}`;
    const statusText = patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : 'N/A';
    const patientId = normalizeId(patient);

    row.innerHTML = `
      <td>${patientId}</td>
      <td>${patient.firstName} ${patient.lastName}</td>
      <td>${patient.age || 'N/A'}/${patient.gender || 'N/A'}</td>
      <td>${patient.diagnosis || 'N/A'}</td>
      <td>${patient.stage || 'N/A'}</td>
      <td>${patient.doctor || 'N/A'}</td>
      <td>${formatDate(patient.nextAppointment)}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td class="action-cell">
        ${checkPermission('view_patients') ? `<button class="action-btn btn-view" data-id="${patientId}"><i class="fas fa-eye"></i> View</button>` : ''}
        ${checkPermission('edit_patients') ? `<button class="action-btn btn-edit" data-id="${patientId}"><i class="fas fa-edit"></i> Edit</button>` : ''}
        ${checkPermission('view_prescriptions') ? `<button class="action-btn btn-prescription" data-id="${patientId}"><i class="fas fa-prescription-bottle-alt"></i> Prescription</button>` : ''}
        ${checkPermission('view_billing') ? `<button class="action-btn btn-billing" data-id="${patientId}"><i class="fas fa-file-invoice"></i> Billing</button>` : ''}
      </td>
    `;
    tbody.appendChild(row);
  });

  addActionButtonListeners();
}


function addActionButtonListeners() {
  document.querySelectorAll('.btn-view').forEach(btn => btn.addEventListener('click', () => viewPatient(btn.dataset.id)));
  document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editPatient(btn.dataset.id)));
  document.querySelectorAll('.btn-prescription').forEach(btn => btn.addEventListener('click', () => handlePrescription(btn.dataset.id)));
  document.querySelectorAll('.btn-billing').forEach(btn => btn.addEventListener('click', () => handleBilling(btn.dataset.id)));
}



// Handle pagination
// Handle pagination (backend-driven)
async function handlePagination(button) {
  const totalPages = Math.ceil(totalCount / patientsPerPage);

  if (button.textContent.includes('Previous') && currentPage > 1) currentPage--;
  else if (button.textContent.includes('Next') && currentPage < totalPages) currentPage++;
  else if (!isNaN(button.textContent)) currentPage = parseInt(button.textContent, 10);
  else return;

  loadPatients(currentPage);
}

async function loadPatients(page = 1) {
  const searchText = document.getElementById("search-name").value.toLowerCase();
  const diagnosisFilter = document.getElementById("filter-diagnosis").value;
  const statusFilter = document.getElementById("filter-status").value;

  const query = new URLSearchParams({
    search: searchText,
    diagnosis: diagnosisFilter,
    status: statusFilter,
    sortColumn: currentSort.column || '',
    sortDirection: currentSort.direction || 'asc',
    page: page,
    limit: patientsPerPage
  });

  try {
    const res = await fetch(`${API_BASE}/api/patients?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch patients");
    const data = await res.json();

    allPatients = data.patients || [];
    filteredPatients = [...allPatients];
    totalCount = data.totalCount || filteredPatients.length;

    renderPatients();
    updatePagination(data.page || 1, data.totalPages || 1, totalCount);
  } catch (err) {
    console.error(err);
    allPatients = [];
    filteredPatients = [];
    totalCount = 0;
    renderPatients();
    updatePagination(1, 1, 0);
  }
}





// Update pagination controls
function updatePagination(current, totalPages, totalCount) {
  const container = document.getElementById("pagination");
  const info = document.getElementById("pagination-info");
  currentPage = current;

  const startIndex = (currentPage - 1) * patientsPerPage + 1;
  const endIndex = Math.min(currentPage * patientsPerPage, totalCount);
  info.textContent = totalCount > 0 ? `Showing ${startIndex}-${endIndex} of ${totalCount} patients` : "No patients found";

  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="pagination-btn prev-btn ${currentPage===1?'disabled':''}">&laquo; Previous</button>`;
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages/2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages -1);
  if (endPage - startPage +1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages +1);
  if (startPage>1) html+= `<button class="pagination-btn page-btn" data-page="1">1</button><span class="ellipsis">...</span>`;
  for(let i=startPage;i<=endPage;i++) html+= `<button class="pagination-btn page-btn ${i===currentPage?'active':''}" data-page="${i}">${i}</button>`;
  if(endPage<totalPages) html+= `<span class="ellipsis">...</span><button class="pagination-btn page-btn" data-page="${totalPages}">${totalPages}</button>`;
  html+= `<button class="pagination-btn next-btn ${currentPage===totalPages?'disabled':''}">Next &raquo;</button>`;
  container.innerHTML = html;

  container.querySelector(".prev-btn")?.addEventListener("click", ()=>{ if(currentPage>1) loadPatients(currentPage-1)});
  container.querySelectorAll(".page-btn").forEach(btn=>btn.addEventListener("click",()=>{ const p=parseInt(btn.dataset.page,10); if(p!==currentPage) loadPatients(p)}));
  container.querySelector(".next-btn")?.addEventListener("click", ()=>{ if(currentPage<totalPages) loadPatients(currentPage+1)});
}



// View patient details
function normalizeId(patient) {
  return patient._id || patient.id; // prefer backend ID, fallback frontend
}

async function viewPatient(patientId) {
  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Patient not found.");
      return;
    }

    const patient = data.patient;

    // Replace with modal in production
    alert(
      `Viewing patient: ${patient.firstName} ${patient.lastName}\n` +
      `ID: ${patient.patientId}\n` +
      `Diagnosis: ${patient.diagnosis || "N/A"}`
    );

  } catch (error) {
    console.error(error);
    alert("Failed to fetch patient data.");
  }
}



// Edit patient
// Helper to normalize id/_id (reuse everywhere)
async function editPatient(patientId) {
  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Patient not found.");
      return;
    }

    const patient = data.patient;

    // Prefill modal fields
    document.getElementById("first-name").value = patient.firstName || "";
    document.getElementById("last-name").value = patient.lastName || "";
    document.getElementById("dob").value = patient.dob ? patient.dob.split("T")[0] : "";
    document.getElementById("gender").value = patient.gender || "";
    document.getElementById("phone").value = patient.phone || "";
    document.getElementById("email").value = patient.email || "";
    document.getElementById("address").value = patient.address || "";
    document.getElementById("diagnosis").value = patient.diagnosis || "";
    document.getElementById("diagnosis-date").value = patient.diagnosisDate ? patient.diagnosisDate.split("T")[0] : "";
    document.getElementById("stage").value = patient.stage || "";
    document.getElementById("treatment-plan").value = patient.treatmentPlan || "";
    document.getElementById("allergies").value = patient.allergies || "";
    document.getElementById("medical-history").value = patient.medicalHistory || "";
    document.getElementById("insurance-provider").value = patient.insuranceProvider || "";
    document.getElementById("insurance-id").value = patient.insuranceId || "";
    document.getElementById("coverage").value = patient.coverage || "";
    document.getElementById("valid-until").value = patient.validUntil ? patient.validUntil.split("T")[0] : "";
    document.getElementById("doctor").value = patient.doctor || "";
    document.getElementById("status").value = patient.status || "";
    document.getElementById("next-appointment").value = patient.nextAppointment ? patient.nextAppointment.split("T")[0] : "";

    // Track which patient is being edited
    const modal = document.getElementById("patientModal");
    modal.dataset.patientId = patient.patientId;

    // Update modal title
    document.querySelector(".modal-title").textContent = "Edit Patient";

    openModal();

  } catch (error) {
    console.error(error);
    alert("Failed to fetch patient data.");
  }
}




// Calculate date of birth from age
// Calculate date of birth from age
function calculateDOB(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = today.getMonth(); // Keep same month as today
  const birthDay = today.getDate();    // Keep same day as today
  const dob = new Date(birthYear, birthMonth, birthDay);
  return dob.toISOString().split('T')[0]; // Format YYYY-MM-DD
}


// Save patient (add or edit)
// Helper to normalize id/_id
// Helper to normalize id/_id (used when rendering lists)
/*function normalizeId(patient) {
  return patient.id || patient._id;
}*/

// Save patient (add or edit)
// Save patient (add or edit)
async function savePatient() {
  const modal = document.getElementById("patientModal");
  const patientId = modal.dataset.patientId;
  const isEditing = !!patientId;

  const dob = document.getElementById("dob").value;
  const diagnosisDate = document.getElementById("diagnosis-date").value;

 const patientData = {
  firstName: document.getElementById("first-name").value.trim(),
  lastName: document.getElementById("last-name").value.trim(),
  dob: dob ? new Date(dob).toISOString() : null,
  gender: document.getElementById("gender").value,
  phone: document.getElementById("phone").value.trim(),
  email: document.getElementById("email").value.trim(),
  address: document.getElementById("address").value.trim(),
  diagnosis: document.getElementById("diagnosis").value.trim(),
  diagnosisDate: diagnosisDate ? new Date(diagnosisDate).toISOString() : null,
  stage: document.getElementById("stage").value,
  treatmentPlan: document.getElementById("treatment-plan").value,
  allergies: document.getElementById("allergies").value.trim(),
  medicalHistory: document.getElementById("medical-history").value.trim(),
  insuranceProvider: document.getElementById("insurance-provider").value.trim(),
  insuranceId: document.getElementById("insurance-id").value.trim(),
  coverage: document.getElementById("coverage").value,
  validUntil: document.getElementById("valid-until").value
    ? new Date(document.getElementById("valid-until").value).toISOString()
    : null,
  // ✅ respect dropdown, default to active if empty
  status: document.getElementById("status")?.value || "active",
  doctor: document.getElementById("doctor").value || null,
};



  // --- Frontend validation ---
  if (!patientData.firstName || !patientData.lastName || !patientData.dob ||
      !patientData.diagnosis || !patientData.diagnosisDate || 
      !patientData.stage || !patientData.treatmentPlan || !patientData.gender) {
    alert("Please fill in all required fields.");
    return;
  }

  try {
    const url = isEditing
      ? `${API_BASE}/api/patients/${patientId}`
      : `${API_BASE}/api/patients`;
    const method = isEditing ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Save failed:", errorData);
      throw new Error(errorData.error || "Unsuccessful");
    }

    await initializePatients();
    closeModal();
  } catch (error) {
    console.error(error);
    alert("Save failed: " + error.message);
  }
}




// Calculate age from date of birth
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Generate a new patient ID
// Generate a new patient ID
function generatePatientId() {
  // Extract numeric parts of existing IDs (PAT0001 → 1)
  const numericIds = allPatients
    .map(p => {
      const match = (p.id || p._id || "").match(/\d+$/);
      return match ? parseInt(match[0], 10) : null;
    })
    .filter(n => n !== null);

  // Get the max number, default 0 if none exist
  const maxId = numericIds.length ? Math.max(...numericIds) : 0;

  // Next ID, padded to 4 digits
  const nextId = (maxId + 1).toString().padStart(4, "0");

  return `PAT${nextId}`;
}


// Handle prescription
function handlePrescription(patientId) {
  // In a real application, this would redirect to prescriptions page or open a modal
  window.location.href = `pharmacy.html?patientId=${patientId}`;
}

// Handle billing
function handleBilling(patientId) {
  // In a real application, this would redirect to billing page
  window.location.href = `invoice.html?patientId=${patientId}`;
}

function exportCSV() {
  if (!checkPermission('export_data')) {
    alert('Unauthorized Access');
    return;
  }

  // Define all headers
  const headers = [
    'ID', 'First Name', 'Last Name', 'Age', 'Gender', 'Diagnosis', 'Stage', 
    'Doctor', 'Next Appointment', 'Status', 'Phone', 'Email', 'Address',
    'Diagnosis Date', 'Treatment Plan', 'Allergies', 'Medical History',
    'Insurance Provider', 'Insurance ID', 'Coverage', 'Valid Until'
  ];

  // Map filteredPatients to CSV rows
  const csvData = filteredPatients.map(patient => [
    patient.id,
    patient.firstName,
    patient.lastName,
    patient.age,
    patient.gender,
    patient.diagnosis,
    patient.stage,
    patient.doctor,
    formatDate(patient.nextAppointment),
    patient.status,
    patient.phone,
    patient.email,
    patient.address,
    patient.diagnosisDate,
    patient.treatmentPlan,
    patient.allergies,
    patient.medicalHistory,
    patient.insuranceProvider,
    patient.insuranceId,
    patient.coverage,
    patient.validUntil
  ]);

  // Convert to CSV string
  const csvContent = [headers, ...csvData].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `patients_export_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// Export to PDF
// Export to PDF
async function exportPDF() {
  const { jsPDF } = window.jspdf;

  // Check if patients data exists
  if (!filteredPatients || filteredPatients.length === 0) {
    alert("No patient data available to export.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const lineHeight = 6;

  // Draw header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Patient List Report", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 26, { align: "center" });

  let y = 35; // starting y position

  filteredPatients.forEach((p, i) => {
    const lines = [
      `ID: ${p._id || "N/A"}`,
      `Name: ${p.firstName || ""} ${p.lastName || ""}`,
      `Age/Gender: ${p.age || "N/A"} / ${p.gender || "N/A"}`,
      `Phone: ${p.phone || "N/A"}`,
      `Address: ${p.address || "N/A"}`,
      `Diagnosis: ${p.diagnosis || "N/A"}`
    ];

    // Draw background box
    const blockHeight = lines.length * lineHeight + 4;
    doc.setDrawColor(41, 128, 185);
    doc.setFillColor(245, 245, 245);
    doc.rect(marginX, y, pageWidth - marginX * 2, blockHeight, "FD");

    // Draw text inside box
    let yText = y + 2;
    lines.forEach(line => {
      doc.text(line, marginX + 3, yText);
      yText += lineHeight;
    });

    y += blockHeight + 5;

    // Page break if needed
    if (y > 280) {
      doc.addPage();
      y = 35;
    }
  });

  doc.save(`patients_report_${new Date().toISOString().slice(0, 10)}.pdf`);
}


// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return 'N/A';
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}


// Modal functions
function openModal() {
  document.getElementById('patientModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('patientModal').style.display = 'none';
  resetForm();
}

function resetForm() {
  document.querySelector('.modal-title').textContent = 'Add New Patient';

  // ✅ Fix: clear the dataset on #patientModal, not .modal-content
  document.getElementById('patientModal').dataset.patientId = '';

  // Reset tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('personal').classList.add('active');
  document.querySelector('[onclick="openTab(event, \'personal\')"]').classList.add('active');
  
  // Clear all form fields
  document.querySelectorAll('#patientModal input, #patientModal select, #patientModal textarea').forEach(field => {
    field.value = '';
  });
}

// Tab switching function
function openTab(evt, tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show the specific tab content and mark button as active
  document.getElementById(tabName).classList.add('active');
  evt.currentTarget.classList.add('active');
}

// Logout function
function logout() {
  // In a real application, this would clear authentication tokens and redirect
  window.location.href = 'index.html';
}

// Close modal if clicked outside
window.onclick = function(event) {
  const modal = document.getElementById('patientModal');
  if (event.target === modal) {
    closeModal();
  }
};
