  // Sample data for medicines
      let medicines = [
        {
          id: 1,
          name: "Paclitaxel Injection",
          batchNumber: "BATCH-2025-001",
          expiryDate: "2024-03-15",
          quantity: 45,
          unitPrice: 12500,
          category: "antineoplastics",
          status: "low",
        },
        {
          id: 2,
          name: "Carboplatin",
          batchNumber: "BATCH-2025-002",
          expiryDate: "2024-06-30",
          quantity: 82,
          unitPrice: 8750,
          category: "antineoplastics",
          status: "adequate",
        },
        {
          id: 3,
          name: "Tamoxifen Tablets",
          batchNumber: "BATCH-2025-003",
          expiryDate: "2025-12-31",
          quantity: 12,
          unitPrice: 450,
          category: "antineoplastics",
          status: "expired",
        },
        {
          id: 4,
          name: "Doxorubicin Injection",
          batchNumber: "BATCH-2025-004",
          expiryDate: "2024-02-28",
          quantity: 28,
          unitPrice: 15200,
          category: "antineoplastics",
          status: "adequate",
        },
        {
          id: 5,
          name: "Cyclophosphamide",
          batchNumber: "BATCH-2025-005",
          expiryDate: "2024-09-30",
          quantity: 64,
          unitPrice: 6800,
          category: "antineoplastics",
          status: "adequate",
        },
        {
          id: 6,
          name: "Amoxicillin",
          batchNumber: "BATCH-2025-006",
          expiryDate: "2024-05-15",
          quantity: 120,
          unitPrice: 350,
          category: "antibiotics",
          status: "adequate",
        },
        {
          id: 7,
          name: "Ibuprofen",
          batchNumber: "BATCH-2025-007",
          expiryDate: "2024-07-20",
          quantity: 8,
          unitPrice: 200,
          category: "analgesics",
          status: "low",
        },
        {
          id: 8,
          name: "Lisinopril",
          batchNumber: "BATCH-2025-008",
          expiryDate: "2025-11-30",
          quantity: 5,
          unitPrice: 180,
          category: "cardiovascular",
          status: "expired",
        },
      ];

      // Sample data for prescriptions
      let prescriptions = [
        {
          id: "RX20251122-001",
          patientName: "John Doe",
          doctor: "Dr. Achieng",
          date: "2025-11-22",
          medicines: ["Paclitaxel", "Carboplatin"],
          status: "pending",
        },
        {
          id: "RX20251121-002",
          patientName: "Mary Smith",
          doctor: "Dr. Kamau",
          date: "2025-11-21",
          medicines: ["Tamoxifen", "Metformin"],
          status: "pending",
        },
        {
          id: "RX20251120-003",
          patientName: "Robert Johnson",
          doctor: "Dr. Achieng",
          date: "2025-11-20",
          medicines: ["Doxorubicin", "Cyclophosphamide"],
          status: "pending",
        },
      ];

      // Global variables
      let currentPage = 1;
      const itemsPerPage = 5;
      let filteredMedicines = [...medicines];
      let currentEditingId = null;

      // DOM elements
      const medicineTableBody = document.getElementById("medicine-table-body");
      const prescriptionsTableBody = document.getElementById(
        "prescriptions-table-body"
      );
      const paginationInfo = document.getElementById("pagination-info");
      const paginationControls = document.getElementById("pagination-controls");
      const searchInput = document.getElementById("search-medicine");
      const categoryFilter = document.getElementById("filter-category");
      const statusFilter = document.getElementById("filter-status");
      const applyFiltersBtn = document.getElementById("apply-filters-btn");
      const medicineModal = document.getElementById("medicine-modal");
      const prescriptionModal = document.getElementById("prescription-modal");
      const restockModal = document.getElementById("restock-modal");
      const medicineForm = document.getElementById("medicine-form");
      const modalTitle = document.getElementById("modal-title");
      const addMedicineBtn = document.getElementById("add-medicine-btn");
      const addMedicineBtn2 = document.getElementById("add-medicine-btn-2");
      const exportReportBtn = document.getElementById("export-report-btn");
      const restockBtn = document.getElementById("restock-btn");
      const refreshPrescriptionsBtn = document.getElementById(
        "refresh-prescriptions-btn"
      );
      const tabButtons = document.querySelectorAll(".tab-btn");
      const inventorySection = document.getElementById("inventory-section");
      const prescriptionsSection = document.getElementById(
        "prescriptions-section"
      );

      // Initialize the application
      function init() {
        renderMedicineTable();
        renderPrescriptionsTable();
        updateDashboardCounts();
        setupEventListeners();
      }

      // Set up event listeners
      function setupEventListeners() {
        // Tab navigation
        tabButtons.forEach((tab) => {
          tab.addEventListener("click", () => {
            const tabId = tab.getAttribute("data-tab");
            switchTab(tabId);
          });
        });

        // Modal controls
        document.querySelectorAll(".modal-close").forEach((btn) => {
          btn.addEventListener("click", () => {
            closeAllModals();
          });
        });

        document
          .getElementById("cancel-btn")
          .addEventListener("click", closeAllModals);
        document
          .getElementById("close-prescription-btn")
          .addEventListener("click", closeAllModals);
        document
          .getElementById("cancel-restock-btn")
          .addEventListener("click", closeAllModals);

        // Add medicine buttons
        addMedicineBtn.addEventListener("click", () => openMedicineModal());
        addMedicineBtn2.addEventListener("click", () => openMedicineModal());

        // Save medicine
        document
          .getElementById("save-medicine-btn")
          .addEventListener("click", saveMedicine);

        // Export report
        exportReportBtn.addEventListener("click", exportToCSV);

        // Restock
        restockBtn.addEventListener("click", openRestockModal);
        document
          .getElementById("confirm-restock-btn")
          .addEventListener("click", confirmRestock);

        // Filtering
        applyFiltersBtn.addEventListener("click", applyFilters);
        searchInput.addEventListener("keyup", () => applyFilters());
        categoryFilter.addEventListener("change", () => applyFilters());
        statusFilter.addEventListener("change", () => applyFilters());

        // Pagination
        document
          .getElementById("prev-page")
          .addEventListener("click", () => changePage(currentPage - 1));
        document
          .getElementById("next-page")
          .addEventListener("click", () => changePage(currentPage + 1));

        // Prescriptions
        refreshPrescriptionsBtn.addEventListener("click", refreshPrescriptions);
        document
          .getElementById("dispense-prescription-btn")
          .addEventListener("click", dispensePrescription);
      }

      // Render medicine table
      function renderMedicineTable() {
        medicineTableBody.innerHTML = "";

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = filteredMedicines.slice(startIndex, endIndex);

        currentItems.forEach((medicine) => {
          const row = document.createElement("tr");

          // Format expiry date
          const expiryDate = new Date(medicine.expiryDate);
          const formattedDate = expiryDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          // Format price with commas
          const formattedPrice = medicine.unitPrice.toLocaleString("en-KE");

          // Determine status class
          let statusClass = "";
          let statusText = "";

          if (medicine.status === "low") {
            statusClass = "status-low";
            statusText = "Low Stock";
          } else if (medicine.status === "adequate") {
            statusClass = "status-adequate";
            statusText = "Adequate";
          } else if (medicine.status === "expired") {
            statusClass = "status-expired";
            statusText = "Expired";
          }

          row.innerHTML = `
          <td>${medicine.name}</td>
          <td>${medicine.batchNumber}</td>
          <td>${formattedDate}</td>
          <td>${medicine.quantity}</td>
          <td>${formattedPrice}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td class="action-cell">
            <button class="action-btn btn-edit" data-id="${medicine.id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn btn-delete" data-id="${medicine.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        `;

          medicineTableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll(".btn-edit").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            openMedicineModal(id);
          });
        });

        document.querySelectorAll(".btn-delete").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            deleteMedicine(id);
          });
        });

        // Update pagination info
        updatePaginationInfo();
      }

      // Render prescriptions table
      function renderPrescriptionsTable() {
        prescriptionsTableBody.innerHTML = "";

        prescriptions.forEach((prescription) => {
          const row = document.createElement("tr");

          // Format date
          const prescriptionDate = new Date(prescription.date);
          const formattedDate = prescriptionDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          row.innerHTML = `
          <td>${prescription.id}</td>
          <td>${prescription.patientName}</td>
          <td>${prescription.doctor}</td>
          <td>${formattedDate}</td>
          <td>${prescription.medicines.join(", ")}</td>
          <td><span class="status-badge status-pending">Pending</span></td>
          <td class="action-cell">
            <button class="action-btn btn-view" data-id="${prescription.id}">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="action-btn btn-dispense" data-id="${
              prescription.id
            }">
              <i class="fas fa-check"></i> Dispense
            </button>
          </td>
        `;

          prescriptionsTableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll(".btn-view").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            viewPrescription(id);
          });
        });

        document.querySelectorAll(".btn-dispense").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            dispensePrescription(id);
          });
        });
      }

      // Update pagination info
      function updatePaginationInfo() {
        const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(
          currentPage * itemsPerPage,
          filteredMedicines.length
        );

        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${filteredMedicines.length} medicines`;

        // Update pagination controls
        paginationControls.innerHTML = "";

        // Previous button
        const prevBtn = document.createElement("button");
        prevBtn.className = "pagination-btn";
        prevBtn.id = "prev-page";
        prevBtn.innerHTML = "&laquo; Previous";
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener("click", () => changePage(currentPage - 1));
        paginationControls.appendChild(prevBtn);

        // Page buttons
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
          const pageBtn = document.createElement("button");
          pageBtn.className = "pagination-btn";
          if (i === currentPage) {
            pageBtn.className += " active";
          }
          pageBtn.textContent = i;
          pageBtn.addEventListener("click", () => changePage(i));
          paginationControls.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement("button");
        nextBtn.className = "pagination-btn";
        nextBtn.id = "next-page";
        nextBtn.innerHTML = "Next &raquo;";
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener("click", () => changePage(currentPage + 1));
        paginationControls.appendChild(nextBtn);
      }

      // Change page
      function changePage(page) {
        const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);

        if (page < 1 || page > totalPages) return;

        currentPage = page;
        renderMedicineTable();
      }

      // Apply filters
      function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const status = statusFilter.value;

        filteredMedicines = medicines.filter((medicine) => {
          const matchesSearch =
            medicine.name.toLowerCase().includes(searchTerm) ||
            medicine.batchNumber.toLowerCase().includes(searchTerm);
          const matchesCategory =
            category === "" || medicine.category === category;
          const matchesStatus = status === "" || medicine.status === status;

          return matchesSearch && matchesCategory && matchesStatus;
        });

        currentPage = 1;
        renderMedicineTable();
      }

      // Open medicine modal
      function openMedicineModal(id = null) {
        currentEditingId = id;

        if (id) {
          // Edit mode
          modalTitle.textContent = "Edit Medicine";
          const medicine = medicines.find((m) => m.id == id);

          document.getElementById("medicine-id").value = medicine.id;
          document.getElementById("medicine-name").value = medicine.name;
          document.getElementById("batch-number").value = medicine.batchNumber;
          document.getElementById("expiry-date").value = medicine.expiryDate;
          document.getElementById("quantity").value = medicine.quantity;
          document.getElementById("unit-price").value = medicine.unitPrice;
          document.getElementById("category").value = medicine.category;
        } else {
          // Add mode
          modalTitle.textContent = "Add Medicine";
          medicineForm.reset();
        }

        medicineModal.style.display = "flex";
      }

      // Open restock modal
      function openRestockModal() {
        // For simplicity, we'll just restock the first low stock item
        const lowStockMedicine = medicines.find((m) => m.status === "low");

        if (!lowStockMedicine) {
          alert("No low stock items found!");
          return;
        }

        document.getElementById("restock-medicine-id").value =
          lowStockMedicine.id;
        document.getElementById("restock-medicine-name").value =
          lowStockMedicine.name;
        document.getElementById("current-quantity").value =
          lowStockMedicine.quantity;
        document.getElementById("restock-quantity").value = "";

        restockModal.style.display = "flex";
      }

      // Save medicine
     function saveMedicine() {
  const id = document.getElementById("medicine-id").value;
  const name = document.getElementById("medicine-name").value;
  const batchNumber = document.getElementById("batch-number").value;
  const expiryDate = document.getElementById("expiry-date").value;
  const quantity = parseInt(document.getElementById("quantity").value);
  const unitPrice = parseFloat(document.getElementById("unit-price").value);
  const category = document.getElementById("category").value;

  // Validate form
  if (
    !name ||
    !batchNumber ||
    !expiryDate ||
    isNaN(quantity) ||
    isNaN(unitPrice) ||
    !category
  ) {
    alert("Please fill in all fields with valid values.");
    return;
  }

  // Determine status based on quantity and expiry date
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  let status = "adequate";
  if (quantity < 10) {
    status = "low";
  } else if (daysUntilExpiry < 30) {
    status = "expired";
  }

  if (id) {
    // Update existing medicine
    const index = medicines.findIndex((m) => m.id == id);
    if (index !== -1) {
      medicines[index] = {
        ...medicines[index],
        name,
        batchNumber,
        expiryDate,
        quantity,
        unitPrice,
        category,
        status,
      };
    }
  } else {
    // Add new medicine
    const newId =
      medicines.length > 0
        ? Math.max(...medicines.map((m) => m.id)) + 1
        : 1;
    medicines.push({
      id: newId,
      name,
      batchNumber,
      expiryDate,
      quantity,
      unitPrice,
      category,
      status,
    });
  }

  closeAllModals();
  applyFilters(); // Reapply filters and refresh table
  updateDashboardCounts();
}

      // Delete medicine
      function deleteMedicine(id) {
        if (confirm("Are you sure you want to delete this medicine?")) {
          medicines = medicines.filter((m) => m.id != id);
          applyFilters(); // Reapply filters and refresh table
          updateDashboardCounts();
        }
      }

      // Confirm restock
      function confirmRestock() {
        const id = document.getElementById("restock-medicine-id").value;
        const quantityToAdd = parseInt(
          document.getElementById("restock-quantity").value
        );

        if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
          alert("Please enter a valid quantity to add.");
          return;
        }

        const medicine = medicines.find((m) => m.id == id);
        if (medicine) {
          medicine.quantity += quantityToAdd;

          // Update status
          if (medicine.quantity >= 10) {
            medicine.status = "adequate";
          }

          closeAllModals();
          applyFilters(); // Reapply filters and refresh table
          updateDashboardCounts();
          alert(
            `Successfully added ${quantityToAdd} units to ${medicine.name}. New quantity: ${medicine.quantity}`
          );
        }
      }

      // View prescription
      function viewPrescription(id) {
        const prescription = prescriptions.find((p) => p.id === id);
        if (prescription) {
          const prescriptionDetails = document.getElementById(
            "prescription-details"
          );
          prescriptionDetails.innerHTML = `
          <div class="form-group">
            <label>Prescription ID</label>
            <p>${prescription.id}</p>
          </div>
          <div class="form-group">
            <label>Patient Name</label>
            <p>${prescription.patientName}</p>
          </div>
          <div class="form-group">
            <label>Doctor</label>
            <p>${prescription.doctor}</p>
          </div>
          <div class="form-group">
            <label>Date</label>
            <p>${new Date(prescription.date).toLocaleDateString()}</p>
          </div>
          <div class="form-group">
            <label>Medicines</label>
            <ul>
              ${prescription.medicines.map((med) => `<li>${med}</li>`).join("")}
            </ul>
          </div>
        `;

          prescriptionModal.style.display = "flex";
        }
      }

      // Dispense prescription
      function dispensePrescription(id = null) {
        // If id is provided directly (from the table button), use it
        // Otherwise, use the prescription currently displayed in the modal
        const prescriptionId =
          id ||
          document.getElementById("prescription-details").querySelector("p")
            .textContent;

        if (confirm("Mark this prescription as dispensed?")) {
          prescriptions = prescriptions.filter((p) => p.id !== prescriptionId);
          renderPrescriptionsTable();
          updateDashboardCounts();
          closeAllModals();
          alert("Prescription marked as dispensed.");
        }
      }

      // Refresh prescriptions
      function refreshPrescriptions() {
        // In a real application, this would fetch new data from the server
        alert("Prescriptions refreshed.");
      }

      // Export to CSV
      function exportToCSV() {
        const headers = [
          "Name",
          "Batch Number",
          "Expiry Date",
          "Quantity",
          "Unit Price",
          "Category",
          "Status",
        ];
        const csvData = [
          headers.join(","),
          ...medicines.map((medicine) =>
            [
              medicine.name,
              medicine.batchNumber,
              medicine.expiryDate,
              medicine.quantity,
              medicine.unitPrice,
              medicine.category,
              medicine.status,
            ].join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvData], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "medicine_inventory.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Update dashboard counts
      function updateDashboardCounts() {
        document.getElementById("total-medicines").textContent =
          medicines.length;
        document.getElementById("pending-prescriptions").textContent =
          prescriptions.length;

        const lowStockCount = medicines.filter(
          (m) => m.status === "low"
        ).length;
        document.getElementById("low-stock-items").textContent = lowStockCount;

        // Update expiry alert
        const today = new Date();
        const expiringSoon = medicines.filter((medicine) => {
          const expiryDate = new Date(medicine.expiryDate);
          const daysUntilExpiry = Math.floor(
            (expiryDate - today) / (1000 * 60 * 60 * 24)
          );
          return daysUntilExpiry > 0 && daysUntilExpiry <= 15;
        });

        document.getElementById(
          "expiry-alert-text"
        ).textContent = `${expiringSoon.length} medications will expire in the next 15 days. Please review inventory.`;
      }

      // Switch tabs
      function switchTab(tabId) {
        // Update tab buttons
        tabButtons.forEach((tab) => {
          if (tab.getAttribute("data-tab") === tabId) {
            tab.classList.add("active");
          } else {
            tab.classList.remove("active");
          }
        });

        // Show/hide sections
        if (tabId === "inventory") {
          inventorySection.style.display = "block";
          prescriptionsSection.style.display = "none";
        } else if (tabId === "prescriptions") {
          inventorySection.style.display = "none";
          prescriptionsSection.style.display = "block";
        } else {
          inventorySection.style.display = "none";
          prescriptionsSection.style.display = "none";
          alert(`${tabId} tab functionality would be implemented here.`);
        }
      }

      // Close all modals
      function closeAllModals() {
        document.querySelectorAll(".modal").forEach((modal) => {
          modal.style.display = "none";
        });
      }

      // Logout function
      function logout() {
        if (confirm("Are you sure you want to logout?")) {
          alert("Logging out...");
          // In a real application, this would redirect to the login page
           window.location.href = 'index.html';
        }
      }

      // Initialize the application when the DOM is loaded
      document.addEventListener("DOMContentLoaded", init);
   // Role-Based Access Control Configuration
const userRoles = {
  admin: {
    inventory: { view: true, add: true, edit: true, delete: true, export: true },
    prescriptions: { view: true, dispense: true },
    billing: { view: true, process: true },
    reports: { view: true, generate: true },
    settings: { view: true, modify: true }
  },
  pharmacist: {
    inventory: { view: true, add: true, edit: true, delete: false, export: true },
    prescriptions: { view: true, dispense: true },
    billing: { view: true, process: false },
    reports: { view: true, generate: false },
    settings: { view: false, modify: false }
  },
  cashier: {
    inventory: { view: true, add: false, edit: false, delete: false, export: false },
    prescriptions: { view: true, dispense: false },
    billing: { view: true, process: true },
    reports: { view: true, generate: false },
    settings: { view: false, modify: false }
  }
};

// Current user role (this would typically come from your authentication system)
let currentUserRole = 'admin'; // Default to admin - you would set this based on logged in user

// Function to set user role and apply permissions
function setUserRole(role) {
  if (userRoles.hasOwnProperty(role)) {
    currentUserRole = role;
    applyRolePermissions();
    updateUIForRole();
  } else {
    console.error('Invalid role specified:', role);
  }
}

// Apply permissions based on current user role
function applyRolePermissions() {
  const permissions = userRoles[currentUserRole];
  
  // Inventory permissions
  const addMedicineBtn = document.getElementById('add-medicine-btn');
  const addMedicineBtn2 = document.getElementById('add-medicine-btn-2');
  const exportReportBtn = document.getElementById('export-report-btn');
  const restockBtn = document.getElementById('restock-btn');
  
  if (addMedicineBtn) addMedicineBtn.style.display = permissions.inventory.add ? 'flex' : 'none';
  if (addMedicineBtn2) addMedicineBtn2.style.display = permissions.inventory.add ? 'flex' : 'none';
  if (exportReportBtn) exportReportBtn.style.display = permissions.inventory.export ? 'flex' : 'none';
  if (restockBtn) restockBtn.style.display = permissions.inventory.edit ? 'flex' : 'none';
  
  // Apply permissions to existing medicine rows
  const editButtons = document.querySelectorAll('.btn-edit');
  const deleteButtons = document.querySelectorAll('.btn-delete');
  
  editButtons.forEach(btn => {
    btn.style.display = permissions.inventory.edit ? 'flex' : 'none';
  });
  
  deleteButtons.forEach(btn => {
    btn.style.display = permissions.inventory.delete ? 'flex' : 'none';
  });
  
  // Prescription permissions
  const dispenseButtons = document.querySelectorAll('.btn-dispense');
  dispenseButtons.forEach(btn => {
    btn.style.display = permissions.prescriptions.dispense ? 'flex' : 'none';
  });
}

// Update UI elements based on role
function updateUIForRole() {
  const userInfo = document.querySelector('.user-details h3');
  if (userInfo) {
    userInfo.textContent = `${currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)} John`;
  }
  
  // Update department based on role
  const userDept = document.querySelector('.user-details p');
  if (userDept) {
    if (currentUserRole === 'admin') {
      userDept.textContent = 'Administration Department';
    } else if (currentUserRole === 'pharmacist') {
      userDept.textContent = 'Pharmacy Department';
    } else if (currentUserRole === 'cashier') {
      userDept.textContent = 'Billing Department';
    }
  }
}

// Modify the deleteMedicine function to check permissions
function deleteMedicine(id) {
  if (!userRoles[currentUserRole].inventory.delete) {
    alert('You do not have permission to delete medicines.');
    return;
  }
  
  if (confirm('Are you sure you want to delete this medicine?')) {
    medicines = medicines.filter(m => m.id != id);
    applyFilters();
    updateDashboardCounts();
  }
}

// Modify the saveMedicine function to check permissions
function saveMedicine() {
  const id = document.getElementById('medicine-id').value;
  
  // If editing, check edit permission
  if (id && !userRoles[currentUserRole].inventory.edit) {
    alert('You do not have permission to edit medicines.');
    return;
  }
  
  // If adding, check add permission
  if (!id && !userRoles[currentUserRole].inventory.add) {
    alert('You do not have permission to add medicines.');
    return;
  }
  
  // ... rest of the existing saveMedicine function
}

// Modify the dispensePrescription function to check permissions
function dispensePrescription(id = null) {
  if (!userRoles[currentUserRole].prescriptions.dispense) {
    alert('You do not have permission to dispense prescriptions.');
    return;
  }
  
  // ... rest of the existing dispensePrescription function
}

// Function to initialize role-based access
function initializeRoleBasedAccess() {
  // This would typically come from your authentication system
  // For demonstration, let's check if there's a role in localStorage
  const savedRole = localStorage.getItem('userRole');
  if (savedRole && userRoles.hasOwnProperty(savedRole)) {
    setUserRole(savedRole);
  } else {
    // Default to admin if no role is set
    setUserRole('admin');
  }
  
  // Add role switcher for demonstration purposes (remove in production)
  addRoleSwitcher();
}

// Add role switcher for demonstration (remove in production)
function addRoleSwitcher() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;
  
  const roleSwitcher = document.createElement('select');
  roleSwitcher.id = 'role-switcher';
  roleSwitcher.innerHTML = `
    <option value="admin">Admin</option>
    <option value="pharmacist">Pharmacist</option>
    <option value="cashier">Cashier</option>
  `;
  roleSwitcher.value = currentUserRole;
  roleSwitcher.style.marginRight = '10px';
  roleSwitcher.onchange = function() {
    setUserRole(this.value);
    localStorage.setItem('userRole', this.value);
  };
  
  headerActions.insertBefore(roleSwitcher, headerActions.firstChild);
}

// Initialize role-based access when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize your app first
  init();
  
  // Then initialize role-based access
  initializeRoleBasedAccess();
});

// Update the init function to include applyRolePermissions
const originalInit = init;
init = function() {
  originalInit();
  applyRolePermissions();
};