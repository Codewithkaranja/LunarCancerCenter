
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
function initializePatients() {
  // In a real application, this would be an API call
  allPatients = [...samplePatients];
  filteredPatients = [...allPatients];
  
  renderPatients();
  updatePagination();
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
function handleSearch() {
  const searchText = document.getElementById('search-name').value.toLowerCase();
  const diagnosisFilter = document.getElementById('filter-diagnosis').value;
  const statusFilter = document.getElementById('filter-status').value;
  
  filteredPatients = allPatients.filter(patient => {
    const matchesSearch = searchText === '' || 
      patient.id.toLowerCase().includes(searchText) ||
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchText);
    
    const matchesDiagnosis = diagnosisFilter === '' || patient.diagnosis.toLowerCase().includes(diagnosisFilter);
    const matchesStatus = statusFilter === '' || patient.status === statusFilter;
    
    return matchesSearch && matchesDiagnosis && matchesStatus;
  });
  
  currentPage = 1;
  renderPatients();
  updatePagination();
}

// Handle sorting
function handleSort(column) {
  const columnMap = {
    'Patient ID': 'id',
    'Name': 'lastName',
    'Age/Gender': 'age',
    'Diagnosis': 'diagnosis',
    'Stage': 'stage',
    'Doctor': 'doctor',
    'Next Appointment': 'nextAppointment',
    'Status': 'status'
  };
  
  const sortField = columnMap[column];
  
  if (currentSort.column === sortField) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.column = sortField;
    currentSort.direction = 'asc';
  }
  
  filteredPatients.sort((a, b) => {
    let valueA = a[sortField];
    let valueB = b[sortField];
    
    // Special handling for name sorting
    if (sortField === 'lastName') {
      valueA = `${a.lastName} ${a.firstName}`;
      valueB = `${b.lastName} ${b.firstName}`;
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
    
    row.innerHTML = `
      <td>${patient.id}</td>
      <td>${patient.firstName} ${patient.lastName}</td>
      <td>${patient.age}/${patient.gender}</td>
      <td>${patient.diagnosis}</td>
      <td>${patient.stage}</td>
      <td>${patient.doctor}</td>
      <td>${formatDate(patient.nextAppointment)}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td class="action-cell">
        ${checkPermission('view_patients') ? 
          `<button class="action-btn btn-view" data-id="${patient.id}">
            <i class="fas fa-eye"></i> View
          </button>` : ''}
        ${checkPermission('edit_patients') ? 
          `<button class="action-btn btn-edit" data-id="${patient.id}">
            <i class="fas fa-edit"></i> Edit
          </button>` : ''}
        ${checkPermission('view_prescriptions') ? 
          `<button class="action-btn btn-prescription" data-id="${patient.id}">
            <i class="fas fa-prescription-bottle-alt"></i> Prescription
          </button>` : ''}
        ${checkPermission('view_billing') ? 
          `<button class="action-btn btn-billing" data-id="${patient.id}">
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
    btn.addEventListener('click', () => viewPatient(btn.dataset.id));
  });
  
  // Edit button
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => editPatient(btn.dataset.id));
  });
  
  // Prescription button
  document.querySelectorAll('.btn-prescription').forEach(btn => {
    btn.addEventListener('click', () => handlePrescription(btn.dataset.id));
  });
  
  // Billing button
  document.querySelectorAll('.btn-billing').forEach(btn => {
    btn.addEventListener('click', () => handleBilling(btn.dataset.id));
  });
}

// Handle pagination
function handlePagination(button) {
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  
  if (button.textContent.includes('Previous') && currentPage > 1) {
    currentPage--;
  } else if (button.textContent.includes('Next') && currentPage < totalPages) {
    currentPage++;
  } else if (!isNaN(button.textContent)) {
    currentPage = parseInt(button.textContent);
  }
  
  renderPatients();
  updatePagination();
}

// Update pagination controls
function updatePagination() {
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const paginationContainer = document.getElementById('pagination');
  const paginationInfo = document.getElementById('pagination-info');
  
  // Update pagination info
  const startIndex = (currentPage - 1) * patientsPerPage + 1;
  const endIndex = Math.min(startIndex + patientsPerPage - 1, filteredPatients.length);
  paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${filteredPatients.length} patients`;
  
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
function viewPatient(patientId) {
  const patient = allPatients.find(p => p.id === patientId);
  if (!patient) return;
  
  // In a real application, this would open a detailed view modal or page
  alert(`Viewing patient: ${patient.firstName} ${patient.lastName}\nID: ${patient.id}\nDiagnosis: ${patient.diagnosis}`);
}

// Edit patient
function editPatient(patientId) {
  const patient = allPatients.find(p => p.id === patientId);
  if (!patient) return;
  
  // Fill the form with patient data
  document.getElementById('first-name').value = patient.firstName;
  document.getElementById('last-name').value = patient.lastName;
  document.getElementById('dob').value = calculateDOB(patient.age);
  document.getElementById('gender').value = patient.gender.toLowerCase();
  document.getElementById('phone').value = patient.phone;
  document.getElementById('email').value = patient.email;
  document.getElementById('address').value = patient.address;
  
  document.getElementById('diagnosis').value = patient.diagnosis.toLowerCase().replace(' cancer', '').replace(' ', '');
  document.getElementById('diagnosis-date').value = patient.diagnosisDate;
  document.getElementById('stage').value = patient.stage.includes('Stage') ? patient.stage.toLowerCase().replace('stage ', '') : '';
  document.getElementById('treatment-plan').value = patient.treatmentPlan;
  document.getElementById('allergies').value = patient.allergies;
  document.getElementById('medical-history').value = patient.medicalHistory;
  
  document.getElementById('insurance-provider').value = patient.insuranceProvider;
  document.getElementById('insurance-id').value = patient.insuranceId;
  document.getElementById('coverage').value = patient.coverage;
  document.getElementById('valid-until').value = patient.validUntil;
  
  // Change modal title and set data attribute for editing
  document.querySelector('.modal-title').textContent = 'Edit Patient';
  document.querySelector('.modal-content').dataset.patientId = patientId;
  
  openModal();
}

// Calculate date of birth from age
function calculateDOB(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  return `${birthYear}-01-01`; // Approximate DOB
}

// Save patient (add or edit)
function savePatient() {
  // Get form data
  const patientId = document.querySelector('.modal-content').dataset.patientId;
  const isEditing = !!patientId;
  
  const patientData = {
    firstName: document.getElementById('first-name').value,
    lastName: document.getElementById('last-name').value,
    age: calculateAge(document.getElementById('dob').value),
    gender: document.getElementById('gender').value.toUpperCase(),
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    address: document.getElementById('address').value,
    diagnosis: document.getElementById('diagnosis').value,
    diagnosisDate: document.getElementById('diagnosis-date').value,
    stage: document.getElementById('stage').value,
    treatmentPlan: document.getElementById('treatment-plan').value,
    allergies: document.getElementById('allergies').value,
    medicalHistory: document.getElementById('medical-history').value,
    insuranceProvider: document.getElementById('insurance-provider').value,
    insuranceId: document.getElementById('insurance-id').value,
    coverage: document.getElementById('coverage').value,
    validUntil: document.getElementById('valid-until').value,
    status: 'active',
    doctor: 'Dr. Achieng' // Default doctor, in real app this might come from user session
  };
  
  // Generate ID for new patients
  if (!isEditing) {
    patientData.id = generatePatientId();
    allPatients.push(patientData);
  } else {
    // Update existing patient
    const index = allPatients.findIndex(p => p.id === patientId);
    if (index !== -1) {
      patientData.id = patientId;
      allPatients[index] = patientData;
    }
  }
  
  // Reset filtered patients and update display
  filteredPatients = [...allPatients];
  renderPatients();
  updatePagination();
  
  closeModal();
  resetForm();
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
function generatePatientId() {
  const maxId = Math.max(...allPatients.map(p => parseInt(p.id.substring(1))));
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

// Export to CSV
function exportCSV() {
  if (!checkPermission('export_data')) {
    alert('You do not have permission to export data.');
    return;
  }
  
  const headers = ['ID', 'Name', 'Age', 'Gender', 'Diagnosis', 'Stage', 'Doctor', 'Next Appointment', 'Status'];
  const csvData = filteredPatients.map(patient => [
    patient.id,
    `${patient.firstName} ${patient.lastName}`,
    patient.age,
    patient.gender,
    patient.diagnosis,
    patient.stage,
    patient.doctor,
    formatDate(patient.nextAppointment),
    patient.status
  ]);
  
  const csvContent = [headers, ...csvData].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `patients_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to PDF
function exportPDF() {
  if (!checkPermission('export_data')) {
    alert('You do not have permission to export data.');
    return;
  }
  
  // In a real application, you would use a library like jsPDF
  alert('PDF export functionality would typically use a library like jsPDF. This is a placeholder for the export feature.');
  
  // Example of what the implementation might look like:
  /*
  const doc = new jsPDF();
  doc.text('Patient List', 20, 20);
  
  let y = 30;
  filteredPatients.forEach(patient => {
    doc.text(`${patient.id} - ${patient.firstName} ${patient.lastName}`, 20, y);
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });
  
  doc.save(`patients_export_${new Date().toISOString().slice(0, 10)}.pdf`);
  */
}

// Format date for display
function formatDate(dateString) {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
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
  document.querySelector('.modal-content').dataset.patientId = '';
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
