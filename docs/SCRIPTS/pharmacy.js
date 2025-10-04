// pharmacy-inventory.js - Complete Backend-Ready Implementation
const API_BASE = "https://lunar-hmis-backend.onrender.com/api";

// Global state
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role":"pharmacist","name":"System User"}');
let medicines = [];
let prescriptions = [];
let activities = [];
let patients = [];
let doctors = [];
let currentEditingId = null;
let prescriptionCart = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

function initializeApp() {
    // Set user role display
    document.getElementById('userRoleDisplay').textContent = 
        currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    
    // Set current date for date filters
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('activityStartDate').value = today;
    document.getElementById('activityEndDate').value = today;
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleSidebar);

    // Medicine management
    document.getElementById('addMedicineBtn').addEventListener('click', () => openMedicineModal());
    document.getElementById('saveMedicineBtn').addEventListener('click', saveMedicine);

    // Prescription management
    document.getElementById('createPrescriptionBtn').addEventListener('click', () => openPrescriptionModal());
    document.getElementById('savePrescriptionBtn').addEventListener('click', savePrescription);
    document.getElementById('directDispenseBtn').addEventListener('click', openDirectDispenseModal);

    // Search and filters
    document.getElementById('searchInventory').addEventListener('input', filterMedicines);
    document.getElementById('categoryFilter').addEventListener('change', filterMedicines);
    document.getElementById('statusFilter').addEventListener('change', filterMedicines);
    document.getElementById('prescriptionStatusFilter').addEventListener('change', filterPrescriptions);

    // Medicine cart in prescription modal
    document.getElementById('presMedicineSelect').addEventListener('change', updateMedicineDetails);
}

// API Service Functions
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API fetch error:', error);
        showNotification(`Error: ${error.message}`, 'error');
        throw error;
    }
}

// Data Loading Functions
async function loadInitialData() {
    try {
        await Promise.all([
            loadMedicines(),
            loadPrescriptions(),
            loadActivities()
        ]);
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

async function loadMedicines() {
    try {
        medicines = await apiFetch('/pharmacy/inventory');
        renderMedicinesTable();
    } catch (error) {
        // Fallback to empty array if endpoint doesn't exist
        medicines = [];
        renderMedicinesTable();
    }
}

async function loadPrescriptions() {
    try {
        prescriptions = await apiFetch('/prescriptions');
        renderPrescriptionsTable();
    } catch (error) {
        prescriptions = [];
        renderPrescriptionsTable();
    }
}

async function loadActivities() {
    try {
        const startDate = document.getElementById('activityStartDate').value;
        const endDate = document.getElementById('activityEndDate').value;
        const type = document.getElementById('activityTypeFilter').value;
        
        let endpoint = '/pharmacy/activities';
        const params = new URLSearchParams();
        
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (type) params.append('type', type);
        
        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }
        
        activities = await apiFetch(endpoint);
        renderActivitiesTable();
    } catch (error) {
        activities = [];
        renderActivitiesTable();
    }
}

async function loadPatientsAndDoctors() {
    try {
        // Load patients
        patients = await apiFetch('/patients');
        const patientSelect = document.getElementById('presPatient');
        patientSelect.innerHTML = '<option value="">Select Patient</option>';
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient._id;
            option.textContent = `${patient.name || `${patient.firstName} ${patient.lastName}`} (${patient.patientId || ''})`;
            patientSelect.appendChild(option);
        });

        // Load doctors
        doctors = await apiFetch('/users?role=doctor');
        const doctorSelect = document.getElementById('presDoctor');
        doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor._id;
            option.textContent = doctor.name || `${doctor.firstName} ${doctor.lastName}`;
            doctorSelect.appendChild(option);
        });

        // Populate medicine select
        const medicineSelect = document.getElementById('presMedicineSelect');
        medicineSelect.innerHTML = '<option value="">Select Medicine</option>';
        medicines.forEach(medicine => {
            if (medicine.quantity > 0) {
                const option = document.createElement('option');
                option.value = medicine._id;
                option.textContent = `${medicine.name} (Stock: ${medicine.quantity})`;
                option.dataset.price = medicine.price;
                medicineSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error loading patients/doctors:', error);
        showNotification('Error loading form data', 'error');
    }
}

// UI Rendering Functions
function renderMedicinesTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const searchTerm = document.getElementById('searchInventory').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const filteredMedicines = medicines.filter(medicine => {
        const matchesSearch = !searchTerm || 
            medicine.name.toLowerCase().includes(searchTerm) ||
            (medicine.description && medicine.description.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || medicine.category === categoryFilter;
        const matchesStatus = !statusFilter || getStockStatus(medicine) === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (filteredMedicines.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                    No medicines found
                </td>
            </tr>
        `;
        return;
    }

    filteredMedicines.forEach(medicine => {
        const status = getStockStatus(medicine);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="font-weight: 600;">${escapeHtml(medicine.name)}</div>
                <div style="font-size: 12px; color: #64748b;">${escapeHtml(medicine.description || '')}</div>
            </td>
            <td>${escapeHtml(medicine.category || 'drug')}</td>
            <td>${escapeHtml(medicine.batchNumber || 'N/A')}</td>
            <td>${medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <div style="font-weight: 600;">${medicine.quantity}</div>
                <div style="font-size: 12px; color: #64748b;">Min: ${medicine.minStockLevel || 10}</div>
            </td>
            <td>$${(medicine.unitPrice || 0).toFixed(2)}</td>
            <td><span class="status-badge status-${status}">${status.replace('-', ' ')}</span></td>
            <td>
                <div class="actions">
                    <button class="btn btn-outline btn-sm" onclick="openEditMedicine('${medicine._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="restockMedicine('${medicine._id}')" title="Restock">
                        <i class="fas fa-boxes"></i>
                    </button>
                    ${currentUser.role === 'admin' ? `
                        <button class="btn btn-outline btn-sm" onclick="deleteMedicine('${medicine._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderPrescriptionsTable() {
    const tbody = document.getElementById('prescriptionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const statusFilter = document.getElementById('prescriptionStatusFilter').value;
    const filteredPrescriptions = prescriptions.filter(prescription => 
        !statusFilter || prescription.status === statusFilter
    );

    if (filteredPrescriptions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-file-medical" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                    No prescriptions found
                </td>
            </tr>
        `;
        return;
    }

    filteredPrescriptions.forEach(prescription => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${prescription._id ? prescription._id.slice(-8) : 'N/A'}</td>
           <td>${escapeHtml(prescription.patientId?.name || 'N/A')}</td>
<td>${escapeHtml(prescription.doctorId?.name || 'N/A')}</td>
 <td>${prescription.date ? new Date(prescription.date).toLocaleDateString() : 'N/A'}</td>
            <td>
                ${(prescription.medicines || []).map(med => 
                    `<div>${escapeHtml(med.name)} - ${escapeHtml(med.dosage)} (${med.quantity})</div>`
                ).join('')}
            </td>
            <td><span class="status-badge status-${prescription.status}">${prescription.status}</span></td>
            <td>
                <div class="actions">
                    ${prescription.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="dispensePrescription('${prescription._id}')" title="Dispense">
                            <i class="fas fa-check"></i> Dispense
                        </button>
                    ` : ''}
                    <button class="btn btn-outline btn-sm" onclick="viewPrescription('${prescription._id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderActivitiesTable() {
    const tbody = document.getElementById('activitiesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (activities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-history" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                    No activities found
                </td>
            </tr>
        `;
        return;
    }

    activities.forEach(activity => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activity.date ? new Date(activity.date).toLocaleString() : 'N/A'}</td>
            <td>${escapeHtml(activity.activityType || 'N/A')}</td>
            <td>${escapeHtml(activity.medicineName || activity.medicineId?.name || 'N/A')}</td>
            <td>${activity.quantity}</td>
            <td>${escapeHtml(activity.patientId?.name || activity.patientName || 'N/A')}</td>
            <td>${escapeHtml(activity.performedByName || activity.dispensedBy?.name || 'System')}</td>
        `;
        tbody.appendChild(row);
    });
}

// Modal Management Functions
function openMedicineModal(medicineId = null) {
    currentEditingId = medicineId;
    const modal = document.getElementById('medicineModal');
    const title = document.getElementById('medicineModalTitle');
    
    if (medicineId) {
        title.textContent = 'Edit Medicine';
        const medicine = medicines.find(m => m._id === medicineId);
        if (medicine) {
            document.getElementById('medName').value = medicine.name || '';
            document.getElementById('medCategory').value = medicine.category || 'drug';
            document.getElementById('medBatch').value = medicine.batchNumber || '';
            document.getElementById('medExpiry').value = medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '';
            document.getElementById('medQuantity').value = medicine.quantity || 0;
            document.getElementById('medPrice').value = medicine.unitPrice || 0;
            document.getElementById('medSupplier').value = medicine.supplier || '';
            document.getElementById('medDescription').value = medicine.description || '';
        }
    } else {
        title.textContent = 'Add New Medicine';
        // Clear form
        document.getElementById('medicineModal').querySelectorAll('input, select, textarea').forEach(element => {
            element.value = '';
        });
        // Set default category
        document.getElementById('medCategory').value = 'drug';
    }
    
    modal.classList.add('active');
}

function closeMedicineModal() {
    document.getElementById('medicineModal').classList.remove('active');
    currentEditingId = null;
}

function openPrescriptionModal() {
    prescriptionCart = [];
    loadPatientsAndDoctors();
    renderPrescriptionCart();
    document.getElementById('prescriptionModal').classList.add('active');
}

function closePrescriptionModal() {
    document.getElementById('prescriptionModal').classList.remove('active');
    prescriptionCart = [];
    // Clear form
    document.getElementById('prescriptionModal').querySelectorAll('input, select, textarea').forEach(element => {
        if (element.id !== 'presMedicineSelect') {
            element.value = '';
        }
    });
}

// Medicine Cart Functions
function updateMedicineDetails() {
    const medicineId = document.getElementById('presMedicineSelect').value;
    const medicine = medicines.find(m => m._id === medicineId);
    
    if (medicine) {
        // Auto-populate dosage based on medicine type
        const dosageInput = document.getElementById('presDosage');
        if (!dosageInput.value) {
            dosageInput.value = 'As directed';
        }
    }
}

function addMedicineToCart() {
    const medicineId = document.getElementById('presMedicineSelect').value;
    const dosage = document.getElementById('presDosage').value;
    const quantity = parseInt(document.getElementById('presQuantity').value);
    
    if (!medicineId) {
        showNotification('Please select a medicine', 'error');
        return;
    }
    
    if (!dosage) {
        showNotification('Please enter dosage instructions', 'error');
        return;
    }
    
    if (!quantity || quantity < 1) {
        showNotification('Please enter a valid quantity', 'error');
        return;
    }
    
    const medicine = medicines.find(m => m._id === medicineId);
    if (!medicine) {
        showNotification('Medicine not found', 'error');
        return;
    }
    
    if (medicine.quantity < quantity) {
        showNotification(`Insufficient stock. Available: ${medicine.quantity}`, 'error');
        return;
    }
    
    // Check if medicine already in cart
    const existingIndex = prescriptionCart.findIndex(item => item.medicineId === medicineId);
    if (existingIndex > -1) {
        prescriptionCart[existingIndex].quantity += quantity;
    } else {
        prescriptionCart.push({
            medicineId: medicineId,
            name: medicine.name,
            dosage: dosage,
            quantity: quantity,
            price: medicine.price // or from input field: parseFloat(document.getElementById('medPrice').value)

        });
    }
    
    renderPrescriptionCart();
    
    // Clear input fields
    document.getElementById('presDosage').value = '';
    document.getElementById('presQuantity').value = '';
    document.getElementById('presMedicineSelect').value = '';
}

function renderPrescriptionCart() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    
    if (prescriptionCart.length === 0) {
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #64748b;">
                <i class="fas fa-shopping-cart" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                No medicines added
            </div>
        `;
        return;
    }
    
    prescriptionCart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div>
                <strong>${escapeHtml(item.name)}</strong>
                <div style="font-size: 12px; color: #64748b;">${escapeHtml(item.dosage)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>Qty: ${item.quantity}</span>
                <button class="btn btn-outline btn-sm" onclick="removeFromCart(${index})" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
}

function removeFromCart(index) {
    prescriptionCart.splice(index, 1);
    renderPrescriptionCart();
}

// Core Business Logic Functions
async function saveMedicine() {
    const formData = {
        name: document.getElementById('medName').value.trim(),
        category: document.getElementById('medCategory').value,
        batchNumber: document.getElementById('medBatch').value.trim(),
        expiryDate: document.getElementById('medExpiry').value,
        quantity: parseInt(document.getElementById('medQuantity').value),
        price: parseFloat(document.getElementById('medPrice').value)
,
        supplier: document.getElementById('medSupplier').value.trim(),
        description: document.getElementById('medDescription').value.trim()
    };
    
    // Validation
    if (!formData.name || !formData.batchNumber || !formData.expiryDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (formData.quantity < 0) {
        showNotification('Quantity cannot be negative', 'error');
        return;
    }
    
    if (formData.unitPrice < 0) {
        showNotification('Unit price cannot be negative', 'error');
        return;
    }
    
    try {
        if (currentEditingId) {
            // Update existing medicine
            await apiFetch(`/pharmacy/inventory/${currentEditingId}`, {
                method: 'PUT',
                body: formData
            });
            showNotification('Medicine updated successfully', 'success');
        } else {
            // Create new medicine
            await apiFetch('/pharmacy/inventory', {
                method: 'POST',
                body: formData
            });
            showNotification('Medicine added successfully', 'success');
        }
        
        closeMedicineModal();
        await loadMedicines();
    } catch (error) {
        console.error('Error saving medicine:', error);
    }
}

async function savePrescription() {
    const patientId = document.getElementById('presPatient').value;
    const doctorId = document.getElementById('presDoctor').value;
    const diagnosis = document.getElementById('presDiagnosis').value.trim();
    const notes = document.getElementById('presNotes').value.trim();
    
    if (!patientId || !doctorId) {
        showNotification('Please select both patient and doctor', 'error');
        return;
    }
    
    if (prescriptionCart.length === 0) {
        showNotification('Please add at least one medicine to the prescription', 'error');
        return;
    }
    
   const formData = {
    patientId: patientId,   // instead of patient
    doctorId: doctorId,     // instead of doctor
    diagnosis: diagnosis,
    notes: notes,
    medicines: prescriptionCart
};

    
    try {
        await apiFetch('/prescriptions', {
            method: 'POST',
            body: formData
        });
        
        showNotification('Prescription created successfully', 'success');
        closePrescriptionModal();
        await loadPrescriptions();
    } catch (error) {
        console.error('Error saving prescription:', error);
    }
}

async function dispensePrescription(prescriptionId) {
    if (!confirm('Are you sure you want to dispense this prescription? This will update inventory.')) {
        return;
    }
    
    try {
        await apiFetch(`/prescriptions/${prescriptionId}/dispense`, {
            method: 'PUT'
        });
        
        showNotification('Prescription dispensed successfully', 'success');
        await Promise.all([loadPrescriptions(), loadMedicines(), loadActivities()]);
        updateDashboardStats();
    } catch (error) {
        console.error('Error dispensing prescription:', error);
    }
}

async function restockMedicine(medicineId) {
    const quantity = prompt('Enter quantity to add:');
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
        showNotification('Please enter a valid quantity', 'error');
        return;
    }
    
    try {
        await apiFetch(`/pharmacy/inventory/${medicineId}/restock`, {
            method: 'PUT',
            body: { quantity: parseInt(quantity) }
        });
        
        showNotification('Medicine restocked successfully', 'success');
        await loadMedicines();
        updateDashboardStats();
    } catch (error) {
        console.error('Error restocking medicine:', error);
    }
}

async function deleteMedicine(medicineId) {
    if (!confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) {
        return;
    }
    
    try {
        await apiFetch(`/pharmacy/inventory/${medicineId}`, {
            method: 'DELETE'
        });
        
        showNotification('Medicine deleted successfully', 'success');
        await loadMedicines();
        updateDashboardStats();
    } catch (error) {
        console.error('Error deleting medicine:', error);
    }
}

function openDirectDispenseModal() {
    showNotification('Direct dispense feature coming soon!', 'info');
    // Implementation for direct dispense without prescription
}

function viewPrescription(prescriptionId) {
    showNotification('Prescription details view coming soon!', 'info');
    // Implementation for viewing prescription details
}

// Utility Functions
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load tab-specific data if needed
    if (tabName === 'reports') {
        loadReports();
    } else if (tabName === 'activities') {
        loadActivities();
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function filterMedicines() {
    renderMedicinesTable();
}

function filterPrescriptions() {
    renderPrescriptionsTable();
}

function getStockStatus(medicine) {
    if (!medicine.quantity || medicine.quantity <= 0) {
        return 'out-of-stock';
    }
    
    if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date()) {
        return 'expired';
    }
    
    const minStock = medicine.minStockLevel || 10;
    if (medicine.quantity <= minStock) {
        return 'low';
    }
    
    return 'adequate';
}

function updateDashboardStats() {
    const totalMedicines = medicines.length;
    const lowStockCount = medicines.filter(m => getStockStatus(m) === 'low').length;
    const expiringCount = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const expiryDate = new Date(m.expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
    }).length;
    const pendingPrescriptionsCount = prescriptions.filter(p => p.status === 'pending').length;
    
    document.getElementById('totalMedicines').textContent = totalMedicines;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    document.getElementById('expiringCount').textContent = expiringCount;
    document.getElementById('pendingPrescriptions').textContent = pendingPrescriptionsCount;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.openEditMedicine = openMedicineModal;
window.restockMedicine = restockMedicine;
window.deleteMedicine = deleteMedicine;
window.dispensePrescription = dispensePrescription;
window.viewPrescription = viewPrescription;
window.removeFromCart = removeFromCart;
window.loadActivities = loadActivities;
window.logout = logout;