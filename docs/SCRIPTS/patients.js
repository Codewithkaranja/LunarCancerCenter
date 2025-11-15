// ==========================
// patients.js (Completely Rewritten & Debugged)
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
// Debug Mode
// --------------------------
const DEBUG = true;

function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`🔍 ${message}`, data || '');
    }
}

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
// INITIALIZATION
// ==========================

function initializeApp() {
    debugLog('Initializing application...');
    
    // Initialize current user
    initializeCurrentUser();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Apply RBAC
    applyRBAC();
    
    // Load initial data
    loadInitialData();
}

function initializeCurrentUser() {
    debugLog('Initializing current user...');
    
    // Try multiple sources for user data
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            debugLog('User found in storage:', currentUser);
        } catch (e) {
            debugLog('Error parsing user data:', e);
            currentUser = { role: 'admin', name: 'Demo Admin' };
        }
    } else if (token) {
        // If we have a token but no user data, create a basic user object
        currentUser = { role: 'doctor', name: 'Authenticated User' };
        debugLog('Token found, created basic user');
    } else {
        // Fallback for development
        currentUser = { role: 'admin', name: 'Demo Admin' };
        debugLog('No user data found, using demo admin', currentUser);
    }
    
    userRole = currentUser.role;
    debugPermissions();
}

function debugPermissions() {
    if (!currentUser || !currentUser.role) {
        console.warn("❌ No current user or role set!");
        return;
    }

    const role = currentUser.role.toLowerCase();
    const perms = rbacConfig[role]?.can || [];
    
    console.log(`🔐 Current user: ${currentUser.name} (${currentUser.role})`);
    console.log("📋 Permissions available:", perms);
}

// ==========================
// UTILITY FUNCTIONS
// ==========================

function checkPermission(action) {
    if (!currentUser || !currentUser.role) {
        debugLog(`❌ Permission denied: No user role for action ${action}`);
        return false;
    }
    
    const rolePermissions = rbacConfig[currentUser.role]?.can || [];
    const hasPermission = rolePermissions.includes(action);
    
    if (!hasPermission) {
        debugLog(`❌ Permission denied for ${action} to role ${currentUser.role}`);
    }
    
    return hasPermission;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return isNaN(date) ? 'N/A' : date.toLocaleDateString('en-US', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch (e) {
        return 'N/A';
    }
}

function calculateAge(dob) {
    if (!dob) return 'N/A';
    try {
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    } catch (e) {
        return 'N/A';
    }
}

function normalizeId(patient) {
    return patient.patientId || patient._id;
}

function displayPatientId(patient) {
    return patient.patientId || `PAT${String(patient._id).slice(-4).toUpperCase()}`;
}

// ==========================
// ALERT SYSTEM
// ==========================

function showAlert(message, type = "success") {
    debugLog(`Alert: ${type} - ${message}`);
    
    const alertBox = document.createElement("div");
    alertBox.className = `custom-alert ${type}`;
    alertBox.innerHTML = `<span>${message}</span>`;
    alertBox.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        font-weight: bold;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateX(100px);
        ${type === 'success' ? 'background: #28a745;' : ''}
        ${type === 'error' ? 'background: #dc3545;' : ''}
        ${type === 'warning' ? 'background: #ffc107; color: black;' : ''}
    `;

    document.body.appendChild(alertBox);

    // Animate in
    setTimeout(() => {
        alertBox.style.opacity = '1';
        alertBox.style.transform = 'translateX(0)';
    }, 50);

    // Auto remove
    setTimeout(() => {
        alertBox.style.opacity = '0';
        alertBox.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (alertBox.parentNode) {
                alertBox.parentNode.removeChild(alertBox);
            }
        }, 300);
    }, 4000);
}

// ==========================
// DATA LOADING FUNCTIONS
// ==========================

async function loadInitialData() {
    debugLog('Loading initial data...');
    
    try {
        await loadPatients();
        debugLog('Initial data loaded successfully');
    } catch (error) {
        console.error('Failed to load initial data:', error);
        showAlert('Failed to load initial data. Please refresh the page.', 'error');
    }
}

async function loadPatients(page = 1) {
    debugLog(`Loading patients page ${page}...`);
    
    // Show loading state
    const tbody = document.querySelector('.patients-table tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    <div style="padding: 20px; color: #666;">
                        <i class="fas fa-spinner fa-spin"></i> Loading patients...
                    </div>
                </td>
            </tr>
        `;
    }

    const searchText = document.getElementById("search-name")?.value.trim().toLowerCase() || "";
    const diagnosisFilter = document.getElementById("filter-diagnosis")?.value || "";
    const statusFilter = document.getElementById("filter-status")?.value || "";

    const query = new URLSearchParams({
        search: searchText,
        diagnosis: diagnosisFilter,
        status: statusFilter,
        sortColumn: currentSort.column,
        sortDirection: currentSort.direction,
        page: page,
        limit: patientsPerPage
    });

    try {
        debugLog(`Fetching from: ${API_BASE}/api/patients?${query}`);
        
        const response = await fetch(`${API_BASE}/api/patients?${query}`);
        debugLog('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        debugLog('API Response data:', data);

        // Handle different response structures
        if (data.patients && Array.isArray(data.patients)) {
            allPatients = data.patients;
        } else if (Array.isArray(data)) {
            allPatients = data;
        } else {
            allPatients = [];
            debugLog('Unexpected response structure:', data);
        }

        filteredPatients = [...allPatients];
        totalCount = data.totalCount || data.count || allPatients.length;
        currentPage = data.page || page;

        debugLog(`Loaded ${allPatients.length} patients, total count: ${totalCount}`);

        renderPatients();
        
        const totalPages = data.totalPages || Math.ceil(totalCount / patientsPerPage) || 1;
        renderPagination(currentPage, totalPages, totalCount);

    } catch (error) {
        console.error('❌ Error loading patients:', error);
        
        // Show error in table
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center" style="color: #dc3545; padding: 20px;">
                        <i class="fas fa-exclamation-triangle"></i><br>
                        Failed to load patients<br>
                        <small>${error.message}</small>
                    </td>
                </tr>
            `;
        }
        
        showAlert(`Failed to load patients: ${error.message}`, 'error');
        
        // Reset state
        allPatients = [];
        filteredPatients = [];
        totalCount = 0;
        renderPagination(1, 1, 0);
    }
}

async function loadStaffList(selectedDoctorId = null) {
    debugLog('Loading staff list...');
    
    const staffSelect = document.getElementById("doctor");
    if (!staffSelect) {
        console.error('❌ Doctor select element not found!');
        return;
    }

    // Show loading in dropdown
    staffSelect.innerHTML = `<option value="">Loading doctors...</option>`;

    try {
        const response = await fetch(`${API_BASE}/api/staff`);
        debugLog('Staff API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        debugLog('Staff API data:', data);

        if (!data.success) {
            throw new Error("API responded with failure");
        }

        staffSelect.innerHTML = `<option value="">-- Select Doctor --</option>`;

        const doctors = data.staff ? data.staff.filter(s => s.role === "doctor") : [];
        debugLog(`Found ${doctors.length} doctors`);

        if (doctors.length === 0) {
            staffSelect.innerHTML = `<option value="">No doctors available</option>`;
            debugLog('No doctors found in staff data');
            return;
        }

        doctors.forEach(doc => {
            const option = document.createElement("option");
            option.value = doc._id;
            option.textContent = `${doc.firstName} ${doc.lastName}`;
            if (selectedDoctorId && doc._id === selectedDoctorId) {
                option.selected = true;
                debugLog(`Preselected doctor: ${doc.firstName} ${doc.lastName}`);
            }
            staffSelect.appendChild(option);
        });

        debugLog('Staff list loaded successfully');

    } catch (error) {
        console.error('❌ Error loading staff list:', error);
        staffSelect.innerHTML = `<option value="">Error loading doctors</option>`;
        showAlert('Failed to load doctors list', 'error');
    }
}

// ==========================
// RENDERING FUNCTIONS
// ==========================

function renderPatients() {
    debugLog('Rendering patients table...');
    
    const tbody = document.querySelector('.patients-table tbody');
    if (!tbody) {
        console.error('❌ Patients table tbody not found!');
        return;
    }

    tbody.innerHTML = '';

    if (!filteredPatients || filteredPatients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center no-data">
                    <div style="padding: 40px; color: #666;">
                        <i class="fas fa-user-injured" style="font-size: 48px; margin-bottom: 10px;"></i><br>
                        No patients found
                    </div>
                </td>
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
            ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1)
            : 'N/A';

        const actions = [
            checkPermission('view_patients') ? 
                `<button class="action-btn btn-view" data-id="${backendId}" title="View Patient">
                    <i class="fas fa-eye"></i>
                </button>` : '',
            checkPermission('edit_patients') ? 
                `<button class="action-btn btn-edit" data-id="${backendId}" title="Edit Patient">
                    <i class="fas fa-edit"></i>
                </button>` : '',
            checkPermission('delete_patients') ? 
                `<button class="action-btn btn-delete" data-id="${backendId}" title="Delete Patient">
                    <i class="fas fa-trash"></i>
                </button>` : '',
            checkPermission('view_prescriptions') ? 
                `<button class="action-btn btn-prescription" data-id="${backendId}" title="View Prescriptions">
                    <i class="fas fa-prescription-bottle-alt"></i>
                </button>` : '',
            checkPermission('view_billing') ? 
                `<button class="action-btn btn-billing" data-id="${backendId}" title="View Billing">
                    <i class="fas fa-file-invoice"></i>
                </button>` : '',
        ].filter(action => action !== '').join('');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${displayId}</td>
            <td>${fullName}</td>
            <td>${ageGender}</td>
            <td>${patient.diagnosis || 'N/A'}</td>
            <td>${patient.stage || 'N/A'}</td>
            <td>${patient.doctorName || patient.doctor || 'N/A'}</td>
            <td>${formatDate(patient.nextAppointment)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="action-cell">${actions}</td>
        `;
        tbody.appendChild(row);
    });

    debugLog(`Rendered ${filteredPatients.length} patients`);
}

function renderPagination(current, totalPages, totalCount) {
    debugLog(`Rendering pagination: page ${current} of ${totalPages}, total: ${totalCount}`);
    
    const container = document.getElementById("pagination");
    const info = document.getElementById("pagination-info");
    
    if (!container || !info) {
        console.error('❌ Pagination elements not found!');
        return;
    }

    info.textContent = totalCount > 0
        ? `Showing ${(current-1)*patientsPerPage+1}-${Math.min(current*patientsPerPage, totalCount)} of ${totalCount} patients`
        : "No patients found";

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    let html = `
        <button class="pagination-btn prev-btn ${current === 1 ? 'disabled' : ''}" 
                ${current === 1 ? 'disabled' : ''}>
            &laquo; Previous
        </button>
    `;

    if (start > 1) {
        html += `
            <button class="pagination-btn page-btn" data-page="1">1</button>
            <span class="ellipsis">...</span>
        `;
    }

    for (let i = start; i <= end; i++) {
        html += `
            <button class="pagination-btn page-btn ${i === current ? 'active' : ''}" 
                    data-page="${i}">${i}</button>
        `;
    }

    if (end < totalPages) {
        html += `
            <span class="ellipsis">...</span>
            <button class="pagination-btn page-btn" data-page="${totalPages}">${totalPages}</button>
        `;
    }

    html += `
        <button class="pagination-btn next-btn ${current === totalPages ? 'disabled' : ''}" 
                ${current === totalPages ? 'disabled' : ''}>
            Next &raquo;
        </button>
    `;

    container.innerHTML = html;

    // Add event listeners
    container.querySelector(".prev-btn")?.addEventListener("click", () => {
        if (current > 1) loadPatients(current - 1);
    });

    container.querySelectorAll(".page-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const page = parseInt(btn.dataset.page, 10);
            if (page !== current) loadPatients(page);
        });
    });

    container.querySelector(".next-btn")?.addEventListener("click", () => {
        if (current < totalPages) loadPatients(current + 1);
    });
}

// ==========================
// PATIENT CRUD OPERATIONS
// ==========================

async function viewPatient(patientId) {
    debugLog(`Viewing patient: ${patientId}`);
    
    try {
        const response = await fetch(`${API_BASE}/api/patients/${patientId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (!data.success || !data.patient) {
            throw new Error(data.message || "Patient not found");
        }

        const p = data.patient;
        showAlert(
            `Viewing: ${p.firstName} ${p.lastName} (${p.patientId})` +
            `\nGender: ${p.gender}` +
            `\nDiagnosis: ${p.diagnosis || "N/A"}` +
            `\nStage: ${p.stage || "N/A"}` +
            `\nDoctor: ${p.doctor || "N/A"}` +
            `\nStatus: ${p.status || "N/A"}`,
            'success'
        );

    } catch (error) {
        console.error('❌ Error viewing patient:', error);
        showAlert('Failed to load patient details', 'error');
    }
}

async function editPatient(patientId) {
    debugLog(`Editing patient: ${patientId}`);
    
    try {
        const response = await fetch(`${API_BASE}/api/patients/${patientId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (!data.success || !data.patient) {
            throw new Error(data.message || "Patient not found");
        }

        const p = data.patient;

        // Load doctors first
        await loadStaffList(p.doctor || null);

        // Fill the form
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

    } catch (error) {
        console.error('❌ Error loading patient for edit:', error);
        showAlert('Failed to load patient for editing', 'error');
    }
}

async function deletePatient(patientId) {
    debugLog(`Deleting patient: ${patientId}`);
    
    if (!confirm(`Are you sure you want to delete patient ${patientId}? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/patients/${patientId}`, {
            method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to delete patient");
        }

        showAlert(`✅ Patient ${patientId} deleted successfully`, 'success');
        loadPatients(currentPage); // Refresh the current page

    } catch (error) {
        console.error('❌ Error deleting patient:', error);
        showAlert('Failed to delete patient', 'error');
    }
}

async function savePatient() {
    debugLog('Saving patient...');
    
    const patientId = document.getElementById("edit-patientId")?.value;
    const isEdit = !!patientId;

    const formData = {
        patientId: patientId || generatePatientId(),
        firstName: document.getElementById("first-name")?.value.trim() || "",
        lastName: document.getElementById("last-name")?.value.trim() || "",
        dob: document.getElementById("dob")?.value || null,
        gender: document.getElementById("gender")?.value || "",
        phone: document.getElementById("phone")?.value.trim() || "",
        email: document.getElementById("email")?.value.trim() || "",
        address: document.getElementById("address")?.value.trim() || "",
        diagnosis: document.getElementById("diagnosis")?.value.trim() || "",
        diagnosisDate: document.getElementById("diagnosis-date")?.value || null,
        stage: document.getElementById("stage")?.value.trim() || "",
        treatmentPlan: document.getElementById("treatment-plan")?.value.trim() || "",
        allergies: document.getElementById("allergies")?.value.trim() || "",
        medicalHistory: document.getElementById("medical-history")?.value.trim() || "",
        insuranceProvider: document.getElementById("insurance-provider")?.value.trim() || "",
        insuranceId: document.getElementById("insurance-id")?.value.trim() || "",
        coverage: document.getElementById("coverage")?.value.trim() || "",
        validUntil: document.getElementById("valid-until")?.value || null,
        doctor: document.getElementById("doctor")?.value || null,
        status: document.getElementById("status")?.value || "active",
        nextAppointment: document.getElementById("next-appointment")?.value || null,
    };

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.dob) {
        showAlert("Please fill in First Name, Last Name, and Date of Birth.", "error");
        return;
    }

    debugLog('Submitting patient data:', formData);

    try {
        const method = isEdit ? "PUT" : "POST";
        const url = isEdit 
            ? `${API_BASE}/api/patients/${patientId}`
            : `${API_BASE}/api/patients`;

        const response = await fetch(url, {
            method,
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();
        debugLog('Save response:', data);

        if (response.ok && data.success) {
            showAlert(
                isEdit ? "✅ Patient updated successfully!" : "✅ Patient added successfully!", 
                "success"
            );
            closeModal();
            loadPatients(isEdit ? currentPage : 1); // Refresh list
        } else {
            throw new Error(data.message || "Failed to save patient");
        }

    } catch (error) {
        console.error('❌ Error saving patient:', error);
        showAlert(`Failed to save patient: ${error.message}`, "error");
    }
}

function generatePatientId() {
    const numericIds = allPatients.map(p => {
        const match = (p.patientId || "").match(/\d+$/);
        return match ? parseInt(match[0], 10) : null;
    }).filter(n => n !== null);
    
    const maxId = numericIds.length ? Math.max(...numericIds) : 0;
    return `PAT${String(maxId + 1).padStart(4, '0')}`;
}

// ==========================
// MODAL FUNCTIONS
// ==========================

function openAddPatientModal() {
    debugLog('Opening add patient modal...');
    
    resetForm();
    document.querySelector('.modal-title').textContent = 'Add New Patient';
    document.getElementById('savePatientBtn').textContent = 'Add Patient';
    
    // Load doctors for the dropdown
    loadStaffList().then(() => {
        openModal();
    }).catch(error => {
        console.error('Error loading staff for modal:', error);
        openModal(); // Open modal anyway
    });
}

function openModal() {
    debugLog('Opening modal...');
    const modal = document.getElementById('patientModal');
    if (modal) {
        modal.style.display = 'block';
        modal.style.opacity = '1';
    } else {
        console.error('❌ Patient modal not found!');
    }
}

function closeModal() {
    debugLog('Closing modal...');
    const modal = document.getElementById('patientModal');
    if (modal) {
        modal.style.display = 'none';
    }
    resetForm();
}

function resetForm() {
    debugLog('Resetting form...');
    
    document.getElementById("edit-patientId").value = "";
    document.querySelector('.modal-title').textContent = 'Add New Patient';
    document.getElementById('savePatientBtn').textContent = 'Add Patient';

    // Reset tabs to personal info
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('personal')?.classList.add('active');
    document.querySelector('[onclick="openTab(event, \'personal\')"]')?.classList.add('active');

    // Clear all form fields
    document.querySelectorAll('#patientModal input, #patientModal select, #patientModal textarea')
        .forEach(field => {
            if (field.type !== 'button' && field.id !== 'savePatientBtn') {
                field.value = '';
            }
        });
}

function openTab(evt, tabName) {
    debugLog(`Switching to tab: ${tabName}`);
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName)?.classList.add('active');
    evt.currentTarget.classList.add('active');
}

// ==========================
// EVENT HANDLERS
// ==========================

let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadPatients();
    }, 500);
}

function handleSortDropdown(value) {
    debugLog(`Sorting by: ${value}`);
    
    const sortMap = {
        'Sort by: Newest First': { field: 'createdAt', direction: 'desc' },
        'Sort by: Oldest First': { field: 'createdAt', direction: 'asc' },
        'Sort by: Name A-Z': { field: 'lastName', direction: 'asc' },
        'Sort by: Name Z-A': { field: 'lastName', direction: 'desc' },
        'Sort by: Patient ID': { field: 'patientId', direction: 'asc' }
    };

    const sortConfig = sortMap[value];
    if (sortConfig) {
        currentSort = { column: sortConfig.field, direction: sortConfig.direction };
        loadPatients(1);
    }
}

function handlePrescription(patientId) {
    debugLog(`Opening prescriptions for patient: ${patientId}`);
    window.location.href = `pharmacy.html?patientId=${patientId}`;
}

function handleBilling(patientId) {
    debugLog(`Opening billing for patient: ${patientId}`);
    window.location.href = `invoice.html?patientId=${patientId}`;
}

// ==========================
// EVENT LISTENERS SETUP
// ==========================

function setupEventListeners() {
    debugLog('Setting up event listeners...');
    
    // Search and filter listeners
    const searchInput = document.getElementById("search-name");
    const diagnosisFilter = document.getElementById("filter-diagnosis");
    const statusFilter = document.getElementById("filter-status");
    const sortSelect = document.getElementById("sort-dropdown");

    if (searchInput) {
        searchInput.addEventListener("input", handleSearch);
        debugLog('Search input listener added');
    } else {
        console.error('❌ Search input not found!');
    }

    if (diagnosisFilter) {
        diagnosisFilter.addEventListener("change", () => {
            currentPage = 1;
            loadPatients();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            currentPage = 1;
            loadPatients();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => handleSortDropdown(e.target.value));
    }

    // Export buttons
    const exportCsvBtn = document.getElementById("export-csv");
    const exportPdfBtn = document.getElementById("export-pdf");

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", exportCSV);
    }
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", exportPDF);
    }

    // Add patient button
    const addPatientBtn = document.getElementById('add-patient-btn');
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', openAddPatientModal);
        debugLog('Add patient button listener added');
    } else {
        console.error('❌ Add patient button not found!');
    }

    // Modal buttons
    const savePatientBtn = document.getElementById("savePatientBtn");
    const closeModalBtn = document.querySelector(".close");

    if (savePatientBtn) {
        savePatientBtn.addEventListener("click", savePatient);
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeModal);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('patientModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // Table row actions (event delegation)
    const tableBody = document.querySelector('.patients-table tbody');
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const patientId = btn.dataset.id;
            if (!patientId) return;

            if (btn.classList.contains('btn-view')) {
                viewPatient(patientId);
            } else if (btn.classList.contains('btn-edit')) {
                editPatient(patientId);
            } else if (btn.classList.contains('btn-delete')) {
                deletePatient(patientId);
            } else if (btn.classList.contains('btn-prescription')) {
                handlePrescription(patientId);
            } else if (btn.classList.contains('btn-billing')) {
                handleBilling(patientId);
            }
        });
        debugLog('Table event delegation setup');
    } else {
        console.error('❌ Patients table body not found!');
    }

    // Logout handler
    document.addEventListener("click", (e) => {
        if (e.target.closest("#logoutBtn")) {
            debugLog('Logging out...');
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            sessionStorage.clear();
            window.location.href = "index.html";
        }
    });

    debugLog('Event listeners setup completed');
}

// ==========================
// RBAC APPLICATION
// ==========================

function applyRBAC() {
    debugLog('Applying RBAC...');
    
    const addPatientBtn = document.getElementById('add-patient-btn');
    const exportCsvBtn = document.getElementById('export-csv');
    const exportPdfBtn = document.getElementById('export-pdf');

    if (!checkPermission('add_patients') && addPatientBtn) {
        addPatientBtn.style.display = 'none';
        debugLog('Add patient button hidden');
    }

    if (!checkPermission('export_data')) {
        if (exportCsvBtn) exportCsvBtn.style.display = 'none';
        if (exportPdfBtn) exportPdfBtn.style.display = 'none';
        debugLog('Export buttons hidden');
    }

    debugLog('RBAC applied successfully');
}

// ==========================
// EXPORT FUNCTIONS
// ==========================

function exportCSV() {
    if (!filteredPatients.length) {
        showAlert("No patients to export.", "warning");
        return;
    }

    try {
        const headers = [
            "Patient ID", "Name", "Age", "Gender", "Diagnosis", 
            "Stage", "Doctor", "Next Appointment", "Status"
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

        let csvContent = headers.join(",") + "\n" +
            rows.map(row => 
                row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
            ).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert("CSV exported successfully!", "success");

    } catch (error) {
        console.error('Error exporting CSV:', error);
        showAlert("Failed to export CSV", "error");
    }
}

async function exportPDF() {
    if (!filteredPatients.length) {
        showAlert("No patients to export.", "warning");
        return;
    }

    try {
        if (!window.jspdf) {
            throw new Error("jsPDF not loaded");
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("l", "pt", "a4");

        // Title
        doc.setFontSize(16);
        doc.text("Patient List Report", 40, 40);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);

        // Table data
        const headers = [["Patient ID", "Name", "Age", "Gender", "Diagnosis", "Stage", "Doctor", "Next Appointment", "Status"]];
        
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

        // AutoTable
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 80,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [40, 167, 69] },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.width - 60,
                doc.internal.pageSize.height - 20
            );
        }

        doc.save(`patients_report_${new Date().toISOString().split('T')[0]}.pdf`);
        showAlert("PDF exported successfully!", "success");

    } catch (error) {
        console.error('Error exporting PDF:', error);
        showAlert("Failed to export PDF", "error");
    }
}

// ==========================
// APPLICATION START
// ==========================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM Content Loaded - Starting application...');
    console.log('🚀 PATIENTS.JS INITIALIZING...');
    
    try {
        initializeApp();
        console.log('✅ PATIENTS.JS INITIALIZED SUCCESSFULLY');
    } catch (error) {
        console.error('❌ PATIENTS.JS FAILED TO INITIALIZE:', error);
        showAlert('Application failed to initialize. Please check console for details.', 'error');
    }
});

// Global functions for HTML onclick attributes
window.openTab = openTab;