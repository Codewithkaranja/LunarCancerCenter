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
async function initializePatients() {
  try {
    const response = await fetch(`${API_BASE}/api/patients`);
    if (!response.ok) throw new Error("Failed to fetch patients");

    const data = await response.json();

    // ✅ If backend returned patients, use them
    // ✅ If backend empty, fall back to samplePatients
    allPatients = (data && data.length > 0) ? data : samplePatients;
    filteredPatients = [...allPatients];

    renderPatients();
    updatePagination();
  } catch (error) {
    console.error("Error fetching patients:", error);

    // ✅ If backend completely fails, fall back to dummy data
    allPatients = samplePatients;
    filteredPatients = [...allPatients];

    renderPatients();
    updatePagination();
  }
}


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

  try {
    const query = new URLSearchParams({
      search: searchText,
      diagnosis: diagnosisFilter,
      status: statusFilter,
      sortColumn: currentSort.column || '',
      sortDirection: currentSort.direction || 'asc',
      page: currentPage,
      limit: patientsPerPage
    });

    const response = await fetch(`${API_BASE}/api/patients?${query.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch filtered patients');
    const data = await response.json();

    filteredPatients = data.patients;
    renderPatients();
    updatePagination(data.totalCount); // update pagination with backend total
  } catch (error) {
    console.error(error);
    alert('Failed to search patients.');
  }
}

// Handle sorting
function handleSort(column) {
  const columnMap = {
    'Patient ID': 'id',
    'Name': 'lastName',
    'Age/Gender': 'ageGender', // NEW
    'Diagnosis': 'diagnosis',
    'Stage': 'stage',
    'Doctor': 'doctor',
    'Next Appointment': 'nextAppointment',
    'Status': 'status'
  };

  const sortField = columnMap[column];
  if (!sortField) return;

  if (currentSort.column === sortField) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.column = sortField;
    currentSort.direction = 'asc';
  }

  filteredPatients.sort((a, b) => {
    let valueA, valueB;

    if (sortField === 'lastName') {
      valueA = `${a.lastName} ${a.firstName}`;
      valueB = `${b.lastName} ${b.firstName}`;
    } else if (sortField === 'ageGender') {
      valueA = `${a.age}-${a.gender}`;
      valueB = `${b.age}-${b.gender}`;
    } else if (sortField === 'nextAppointment') {
      valueA = new Date(a.nextAppointment);
      valueB = new Date(b.nextAppointment);
    } else {
      valueA = a[sortField];
      valueB = b[sortField];
    }

    if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  renderPatients();
}

// Handle sort dropdown
function handleSortDropdown(value) {
  const sortMap = {
    'Sort by: Newest First': { field: 'nextAppointment', direction: 'desc' },
    'Sort by: Oldest First': { field: 'nextAppointment', direction: 'asc' },
    'Sort by: Name A-Z': { field: 'lastName', direction: 'asc' },
    'Sort by: Name Z-A': { field: 'lastName', direction: 'desc' }
  };
  
  const sortConfig = sortMap[value];
  if (!sortConfig) return;
  
  currentSort.column = sortConfig.field;
  currentSort.direction = sortConfig.direction;
  
  filteredPatients.sort((a, b) => {
    let valueA = a[sortConfig.field];
    let valueB = b[sortConfig.field];
    
    // Special handling for name sorting
    if (sortConfig.field === 'lastName') {
      valueA = `${a.lastName} ${a.firstName}`;
      valueB = `${b.lastName} ${b.firstName}`;
    }
    
    if (valueA < valueB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  renderPatients();
}

// Render patients table
/*function getPatientId(patient) {
  return patient.id || patient._id; // normalize frontend vs backend
}*/

function renderPatients() {
  const tbody = document.querySelector('.patients-table tbody');
  tbody.innerHTML = '';
  
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = Math.min(startIndex + patientsPerPage, filteredPatients.length);
  const patientsToShow = filteredPatients.slice(startIndex, endIndex);
  
  patientsToShow.forEach(patient => {
    const row = document.createElement('tr');
    
    // Format status badge
    const statusClass = `status-${patient.status}`;
    const statusText = patient.status.charAt(0).toUpperCase() + patient.status.slice(1);
    
    const patientId = normalizeId(patient); // 🔑 use normalizeId consistently
    
    row.innerHTML = `
      <td>${patientId}</td>
      <td>${patient.firstName} ${patient.lastName}</td>
      <td>${patient.age}/${patient.gender}</td>
      <td>${patient.diagnosis}</td>
      <td>${patient.stage}</td>
      <td>${patient.doctor}</td>
      <td>${formatDate(patient.nextAppointment)}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td class="action-cell">
        ${checkPermission('view_patients') ? 
          `<button class="action-btn btn-view" data-id="${patientId}">
            <i class="fas fa-eye"></i> View
          </button>` : ''}
        ${checkPermission('edit_patients') ? 
          `<button class="action-btn btn-edit" data-id="${patientId}">
            <i class="fas fa-edit"></i> Edit
          </button>` : ''}
        ${checkPermission('view_prescriptions') ? 
          `<button class="action-btn btn-prescription" data-id="${patientId}">
            <i class="fas fa-prescription-bottle-alt"></i> Prescription
          </button>` : ''}
        ${checkPermission('view_billing') ? 
          `<button class="action-btn btn-billing" data-id="${patientId}">
            <i class="fas fa-file-invoice"></i> Billing
          </button>` : ''}
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add event listeners to action buttons
  addActionButtonListeners();
}


// Add event listeners to action buttons
function addActionButtonListeners() {
  // View button
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      viewPatient(id);
    });
  });

  // Edit button
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      editPatient(id);
    });
  });

  // Prescription button
  document.querySelectorAll('.btn-prescription').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      handlePrescription(id);
    });
  });

  // Billing button
  document.querySelectorAll('.btn-billing').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      handleBilling(id);
    });
  });
}


// Handle pagination
// Handle pagination (backend-driven)
async function handlePagination(button) {
  const totalPages = Math.ceil(totalCount / patientsPerPage);

  if (button.textContent.includes('Previous') && currentPage > 1) {
    currentPage--;
  } else if (button.textContent.includes('Next') && currentPage < totalPages) {
    currentPage++;
  } else if (!isNaN(button.textContent)) {
    currentPage = parseInt(button.textContent, 10);
  } else {
    return;
  }

  try {
    // ✅ Fetch patients from backend with pagination
    const response = await fetch(
      `${API_BASE}/api/patients?page=${currentPage}&limit=${patientsPerPage}`
    );
    if (!response.ok) throw new Error("Failed to fetch patients");

    const data = await response.json();
    allPatients = data.patients;      // store new list
    totalCount = data.totalCount;     // keep count updated
    filteredPatients = [...allPatients]; // reset filters if needed

    renderPatients();
    renderPaginationControls(); // optional: re-render buttons, highlight current page
  } catch (err) {
    console.error(err);
    alert("Error loading patients.");
  }
}

async function fetchPatients(page = 1, limit = 5) {
  try {
    const response = await fetch(`${API_BASE}/api/patients?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch patients');

    const data = await response.json();

    // Backend should return { patients: [...], totalCount: 100 }
    allPatients = data.patients;
    filteredPatients = [...allPatients]; // optional if you want to allow frontend search/filter
    window.totalCount = data.totalCount; 

    renderPatients();
    updatePagination(data.totalCount);
  } catch (error) {
    console.error('Error fetching patients:', error);
  }
}


// Update pagination controls
function updatePagination(totalCount) {
  const totalPages = Math.ceil(totalCount / patientsPerPage);
  const paginationContainer = document.getElementById('pagination');
  const paginationInfo = document.getElementById('pagination-info');
  
  // Update pagination info
  const startIndex = (currentPage - 1) * patientsPerPage + 1;
  const endIndex = Math.min(startIndex + patientsPerPage - 1, filteredPatients.length);
  paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalCount} patients`;
;
  
  // Generate pagination buttons
  let paginationHTML = '';
  
  // Previous button
  paginationHTML += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Previous</button>`;
  
  // Page buttons
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
  }
  
  // Next button
  paginationHTML += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;
  
  paginationContainer.innerHTML = paginationHTML;
}

// View patient details
function normalizeId(patient) {
  return patient._id || patient.id; // prefer backend ID, fallback frontend
}

function viewPatient(patientId) {
  const patient = allPatients.find(p => normalizeId(p) === patientId);
  if (!patient) {
    alert("Patient not found.");
    return;
  }

  // Replace with modal in production
  alert(
    `Viewing patient: ${patient.firstName} ${patient.lastName}\n` +
    `ID: ${normalizeId(patient)}\n` +
    `Diagnosis: ${patient.diagnosis || "N/A"}`
  );
}


// Edit patient
// Helper to normalize id/_id (reuse everywhere)
function normalizeId(patient) {
  return patient.id || patient._id;
}

function editPatient(patientId) {
  const patient = allPatients.find(p => normalizeId(p) === patientId);
  if (!patient) {
    alert("Patient not found.");
    return;
  }

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
  modal.dataset.patientId = normalizeId(patient);

  // Update modal title
  document.querySelector(".modal-title").textContent = "Edit Patient";

  openModal();
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
function normalizeId(patient) {
  return patient.id || patient._id;
}

// Save patient (add or edit)
async function savePatient() {
  const modal = document.getElementById("patientModal");
  const patientId = modal.dataset.patientId;
  const isEditing = !!patientId;

  const dob = document.getElementById('dob').value;

  const patientData = {
    firstName: document.getElementById('first-name').value.trim(),
    lastName: document.getElementById('last-name').value.trim(),
    dob: dob ? new Date(dob).toISOString() : null,   // ✅ send ISO date
    gender: document.getElementById('gender').value,
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    diagnosis: document.getElementById('diagnosis').value.trim(),
    diagnosisDate: document.getElementById('diagnosis-date').value 
      ? new Date(document.getElementById('diagnosis-date').value).toISOString() 
      : null,
    stage: document.getElementById('stage').value,
    treatmentPlan: document.getElementById('treatment-plan').value.trim(),
    allergies: document.getElementById('allergies').value.trim(),
    medicalHistory: document.getElementById('medical-history').value.trim(),
    insuranceProvider: document.getElementById('insurance-provider').value.trim(),
    insuranceId: document.getElementById('insurance-id').value.trim(),
    coverage: document.getElementById('coverage').value,
    validUntil: document.getElementById('valid-until').value 
      ? new Date(document.getElementById('valid-until').value).toISOString() 
      : null,
    status: "active",   // keep if your schema expects it
    doctor: document.getElementById('doctor').value || null, 
  };

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
      throw new Error("Failed to save patient");
    }

    await initializePatients();
    closeModal();
  } catch (error) {
    console.error(error);
    alert("Error saving patient.");
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
  // Find numeric parts of existing IDs
  const numericIds = allPatients
    .map(p => p.id.match(/\d+/))
    .filter(Boolean)
    .map(match => parseInt(match[0], 10));

  const maxId = numericIds.length ? Math.max(...numericIds) : 12344;
  return `P${maxId + 1}`;
}

// Handle prescription
function handlePrescription(patientId) {
  // In a real application, this would redirect to prescriptions page or open a modal
  window.location.href = `prescriptions.html?patientId=${patientId}`;
}

// Handle billing
function handleBilling(patientId) {
  // In a real application, this would redirect to billing page
  window.location.href = `billing.html?patientId=${patientId}`;
}

function exportCSV() {
  if (!checkPermission('export_data')) {
    alert('You do not have permission to export data.');
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
  if (!checkPermission('export_data')) {
    alert('You do not have permission to export data.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const lineHeight = 6;

  // Placeholder logo (replace with your hospital logo later)
  const logoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Pink_ribbon.svg/1200px-Pink_ribbon.svg.png";
;

  // Convert logo to base64
  async function loadLogo(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  const logoData = await loadLogo(logoUrl);

  // Draw header
  function drawHeader() {
    if (logoData) doc.addImage(logoData, "SVG", pageWidth / 2 - 10, 5, 20, 20);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Patient List Report", pageWidth / 2, 30, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 36, { align: "center" });
  }

  // Draw footer
  function drawFooter(pageNumber, totalPages) {
    doc.setFontSize(8);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 20, 290, { align: "right" });
  }

  let y = 45;
  drawHeader();

  filteredPatients.forEach((p, i) => {
    const startY = y;
    const cardWidth = pageWidth - marginX * 2;
    const cardPadding = 5;

    // Prepare patient lines
    const lines = [
      `ID: ${p._id || p.id || "N/A"}`,
      `Name: ${p.firstName || ""} ${p.lastName || ""}`,
      `Age/Gender: ${p.age || "N/A"} / ${p.gender || "N/A"}`,
      `Phone: ${p.phone || "N/A"}  |  Email: ${p.email || "N/A"}`,
      `Address: ${p.address || "N/A"}`,
      `Diagnosis: ${p.diagnosis || "N/A"} (Stage ${p.stage || "N/A"})`,
      `Diagnosis Date: ${p.diagnosisDate ? formatDate(p.diagnosisDate) : "N/A"}`,
      `Treatment Plan: ${p.treatmentPlan || "N/A"}`,
      `Doctor: ${p.doctor || "N/A"}`,
      `Next Appointment: ${p.nextAppointment ? formatDate(p.nextAppointment) : "N/A"}`,
      `Status: ${p.status || "N/A"}`,
      `Allergies: ${p.allergies || "N/A"}`,
      `Medical History: ${p.medicalHistory || "N/A"}`,
      `Insurance: ${p.insuranceProvider || "N/A"} (ID: ${p.insuranceId || "N/A"})`,
      `Coverage: ${p.coverage || "N/A"} | Valid Until: ${p.validUntil ? formatDate(p.validUntil) : "N/A"}`
    ];

    // Draw background box
    const blockHeight = lines.length * lineHeight + 10;
    doc.setDrawColor(41, 128, 185);
    doc.setFillColor(245, 245, 245);
    doc.rect(marginX, startY, cardWidth, blockHeight, "FD");

    // Draw text above background
    let yText = startY + 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    lines.forEach(line => {
      doc.text(line, marginX + cardPadding, yText);
      yText += lineHeight;
    });

    y += blockHeight + 8;

    // Page break
    if (y > 260) {
      doc.addPage();
      y = 45;
      drawHeader();
    }
  });

  // Footer page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

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
