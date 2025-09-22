// Role-Based Access Control Configuration
      const userRoles = {
        admin: {
          prescriptions: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            export: true,
            dispense: true,
          },
          billing: { view: true, process: true },
        },
        doctor: {
          prescriptions: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            export: true,
            dispense: false,
          },
          billing: { view: true, process: false },
        },
        pharmacist: {
          prescriptions: {
            view: true,
            create: false,
            edit: true,
            delete: false,
            export: true,
            dispense: true,
          },
          billing: { view: true, process: false },
        },
        cashier: {
          prescriptions: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            export: false,
            dispense: false,
          },
          billing: { view: true, process: true },
        },
      };

      // Current user role (this would typically come from your authentication system)
      let currentUserRole = "doctor"; // Default to doctor

      // Sample data for medications
      const medications = [
        { id: 1, name: "Paclitaxel Injection", stock: 12, price: 12500 },
        { id: 2, name: "Carboplatin", stock: 82, price: 8750 },
        { id: 3, name: "Doxorubicin", stock: 28, price: 15200 },
        { id: 4, name: "Cyclophosphamide", stock: 64, price: 6800 },
        { id: 5, name: "Tamoxifen", stock: 120, price: 450 },
        { id: 6, name: "Metformin", stock: 200, price: 120 },
        { id: 7, name: "Lisinopril", stock: 150, price: 180 },
      ];

      // Sample data for prescription history
      let prescriptionHistory = [
        {
          id: "RX20251115-001",
          date: "2025-11-15",
          patient: "John Doe",
          medications: ["Paclitaxel", "Carboplatin"],
          doctor: "Dr. Achieng",
          status: "dispensed",
          billStatus: "paid",
        },
        {
          id: "RX20251110-002",
          date: "2025-11-10",
          patient: "Mary Smith",
          medications: ["Tamoxifen", "Metformin"],
          doctor: "Dr. Kamau",
          status: "dispensed",
          billStatus: "paid",
        },
        {
          id: "RX20251105-003",
          date: "2025-11-05",
          patient: "Robert Johnson",
          medications: ["Doxorubicin", "Cyclophosphamide"],
          doctor: "Dr. Achieng",
          status: "cancelled",
          billStatus: "cancelled",
        },
        {
          id: "RX20251101-004",
          date: "2025-11-01",
          patient: "Susan Wangari",
          medications: ["Paclitaxel"],
          doctor: "Dr. Nyong'o",
          status: "submitted",
          billStatus: "pending",
        },
      ];

      // Current prescription items
      let prescriptionItems = [
        {
          medication: "Paclitaxel Injection",
          dosage: "175 mg/m²",
          frequency: "twice",
          duration: "21 days",
          quantity: 3,
          instructions: "Take with food",
        },
        {
          medication: "Carboplatin",
          dosage: "AUC 6",
          frequency: "asneeded",
          duration: "21 days",
          quantity: 2,
          instructions: "Administer IV",
        },
      ];

      // DOM elements
      const prescriptionItemsContainer =
        document.getElementById("prescription-items");
      const historyItemsContainer = document.getElementById("history-items");
      const addMedicationBtn = document.getElementById("add-medication-btn");
      const saveDraftBtn = document.getElementById("save-draft-btn");
      const submitPharmacyBtn = document.getElementById("submit-pharmacy-btn");
      const sendBillingBtn = document.getElementById("send-billing-btn");
      const printPrescriptionBtn = document.getElementById(
        "print-prescription-btn"
      );
      const exportCsvBtn = document.getElementById("export-csv-btn");
      const exportPdfBtn = document.getElementById("export-pdf-btn");
      const applyFiltersBtn = document.getElementById("apply-filters-btn");
      const viewPrescriptionModal = document.getElementById(
        "view-prescription-modal"
      );
      const closeViewBtn = document.getElementById("close-view-btn");
      const reissuePrescriptionBtn = document.getElementById(
        "reissue-prescription-btn"
      );

      // Initialize the application
      function init() {
        renderPrescriptionItems();
        renderPrescriptionHistory();
        setupEventListeners();
        applyRolePermissions();
      }

      // Set up event listeners
      function setupEventListeners() {
        // Add medication
        addMedicationBtn.addEventListener("click", addMedication);

        // Prescription actions
        saveDraftBtn.addEventListener("click", saveDraft);
        submitPharmacyBtn.addEventListener("click", submitToPharmacy);
        sendBillingBtn.addEventListener("click", sendToBilling);
        printPrescriptionBtn.addEventListener("click", printPrescription);

        // Export buttons
        exportCsvBtn.addEventListener("click", exportToCSV);
        exportPdfBtn.addEventListener("click", exportToPDF);

        // Filter button
        applyFiltersBtn.addEventListener("click", applyFilters);

        // Modal buttons
        closeViewBtn.addEventListener(
          "click",
          () => (viewPrescriptionModal.style.display = "none")
        );
        reissuePrescriptionBtn.addEventListener("click", reissuePrescription);

        // Patient selection
        document
          .getElementById("patient-select")
          .addEventListener("change", updatePatientInfo);

        // Role switcher for demonstration (remove in production)
        addRoleSwitcher();
      }

      // Render prescription items
      function renderPrescriptionItems() {
        prescriptionItemsContainer.innerHTML = "";

        prescriptionItems.forEach((item, index) => {
          const row = document.createElement("tr");

          // Create medication dropdown
          const medicationSelect = document.createElement("select");
          medications.forEach((med) => {
            const option = document.createElement("option");
            option.value = med.id;
            option.textContent = med.name;
            if (item.medication === med.name) option.selected = true;
            medicationSelect.appendChild(option);
          });
          medicationSelect.addEventListener("change", (e) =>
            updateMedication(index, e.target.value)
          );

          // Create table row
          row.innerHTML = `
            <td>
              ${medicationSelect.outerHTML}
              ${getStockWarning(item.medication)}
            </td>
            <td><input type="text" value="${
              item.dosage
            }" placeholder="Dosage" onchange="updateDosage(${index}, this.value)"></td>
            <td>
              <select onchange="updateFrequency(${index}, this.value)">
                <option value="once" ${
                  item.frequency === "once" ? "selected" : ""
                }>Once daily</option>
                <option value="twice" ${
                  item.frequency === "twice" ? "selected" : ""
                }>Twice daily</option>
                <option value="thrice" ${
                  item.frequency === "thrice" ? "selected" : ""
                }>Three times daily</option>
                <option value="four" ${
                  item.frequency === "four" ? "selected" : ""
                }>Four times daily</option>
                <option value="asneeded" ${
                  item.frequency === "asneeded" ? "selected" : ""
                }>As needed</option>
              </select>
            </td>
            <td><input type="text" value="${
              item.duration
            }" placeholder="Duration" onchange="updateDuration(${index}, this.value)"></td>
            <td><input type="number" value="${
              item.quantity
            }" min="1" style="width: 60px" onchange="updateQuantity(${index}, this.value)"></td>
            <td><input type="text" value="${
              item.instructions
            }" placeholder="Instructions" onchange="updateInstructions(${index}, this.value)"></td>
            <td class="action-cell">
              <button class="action-btn btn-remove" onclick="removeMedication(${index})">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;

          prescriptionItemsContainer.appendChild(row);
        });
      }

      // Render prescription history
      function renderPrescriptionHistory() {
        historyItemsContainer.innerHTML = "";

        prescriptionHistory.forEach((prescription) => {
          const row = document.createElement("tr");

          // Format date
          const formattedDate = new Date(prescription.date).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }
          );

          // Status badge
          let statusClass = "";
          if (prescription.status === "draft") statusClass = "status-draft";
          else if (prescription.status === "submitted")
            statusClass = "status-submitted";
          else if (prescription.status === "dispensed")
            statusClass = "status-dispensed";
          else if (prescription.status === "cancelled")
            statusClass = "status-cancelled";

          // Bill status badge
          let billStatusClass = "";
          if (prescription.billStatus === "paid")
            billStatusClass = "status-dispensed";
          else if (prescription.billStatus === "pending")
            billStatusClass = "status-submitted";
          else if (prescription.billStatus === "cancelled")
            billStatusClass = "status-cancelled";

          row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${prescription.id}</td>
            <td>${prescription.medications.join(", ")}</td>
            <td>${prescription.doctor}</td>
            <td><span class="status-badge ${statusClass}">${
            prescription.status
          }</span></td>
            <td><span class="status-badge ${billStatusClass}">${
            prescription.billStatus
          }</span></td>
            <td>
              <button class="history-action" onclick="viewPrescription('${
                prescription.id
              }')">
                <i class="fas fa-eye"></i> View
              </button>
            </td>
          `;

          historyItemsContainer.appendChild(row);
        });
      }

      // Get stock warning if applicable
      function getStockWarning(medicationName) {
        const medication = medications.find((m) => m.name === medicationName);
        if (medication && medication.stock < 20) {
          return `<div class="stock-warning">
                    <i class="fas fa-exclamation-circle"></i> Low stock: ${medication.stock} remaining
                  </div>`;
        }
        return "";
      }

      // Add a new medication
      function addMedication() {
        if (!userRoles[currentUserRole].prescriptions.create) {
          alert(
            "You do not have permission to add medications to prescriptions."
          );
          return;
        }

        prescriptionItems.push({
          medication: "",
          dosage: "",
          frequency: "once",
          duration: "",
          quantity: 1,
          instructions: "",
        });

        renderPrescriptionItems();
      }

      // Remove a medication
      function removeMedication(index) {
        if (!userRoles[currentUserRole].prescriptions.delete) {
          alert(
            "You do not have permission to remove medications from prescriptions."
          );
          return;
        }

        prescriptionItems.splice(index, 1);
        renderPrescriptionItems();
      }

      // Update medication
      function updateMedication(index, medicationId) {
        const medication = medications.find((m) => m.id == medicationId);
        if (medication) {
          prescriptionItems[index].medication = medication.name;
          renderPrescriptionItems();
          checkDrugInteractions();
        }
      }

      // Update dosage
      function updateDosage(index, dosage) {
        prescriptionItems[index].dosage = dosage;
      }

      // Update frequency
      function updateFrequency(index, frequency) {
        prescriptionItems[index].frequency = frequency;
      }

      // Update duration
      function updateDuration(index, duration) {
        prescriptionItems[index].duration = duration;
      }

      // Update quantity
      function updateQuantity(index, quantity) {
        prescriptionItems[index].quantity = quantity;
      }

      // Update instructions
      function updateInstructions(index, instructions) {
        prescriptionItems[index].instructions = instructions;
      }

      // Check for drug interactions
      function checkDrugInteractions() {
        // Simple interaction check - in a real app, this would be more sophisticated
        const currentMeds = document.getElementById(
          "patient-info-current-meds"
        ).textContent;
        const prescribedMeds = prescriptionItems.map((item) => item.medication);

        // Check if any prescribed meds might interact with current meds
        const hasInteraction = prescribedMeds.some(
          (med) =>
            currentMeds.includes(med) ||
            (med === "Paclitaxel" && currentMeds.includes("Metformin"))
        );

        document.getElementById("interaction-alert").style.display =
          hasInteraction ? "flex" : "none";
      }

      // Update patient info based on selection
      function updatePatientInfo() {
        const patientSelect = document.getElementById("patient-select");
        const selectedPatient = patientSelect.value;

        // In a real app, this would fetch patient data from an API
        if (selectedPatient === "patient1") {
          document.getElementById("patient-info-name").textContent = "John Doe";
          document.getElementById("patient-info-id").textContent = "P12345";
          document.getElementById("patient-info-age").textContent =
            "42 years, Male";
          document.getElementById("patient-info-last-visit").textContent =
            "15 Nov 2025";
          document.getElementById("patient-info-allergies").textContent =
            "Penicillin, Sulfa drugs";
          document.getElementById("patient-info-current-meds").textContent =
            "Metformin, Lisinopril";
        } else if (selectedPatient === "patient2") {
          document.getElementById("patient-info-name").textContent =
            "Mary Smith";
          document.getElementById("patient-info-id").textContent = "P12346";
          document.getElementById("patient-info-age").textContent =
            "38 years, Female";
          document.getElementById("patient-info-last-visit").textContent =
            "12 Nov 2025";
          document.getElementById("patient-info-allergies").textContent =
            "None";
          document.getElementById("patient-info-current-meds").textContent =
            "Tamoxifen";
        }

        checkDrugInteractions();
      }

      // Save prescription as draft
      function saveDraft() {
        if (!userRoles[currentUserRole].prescriptions.create) {
          alert("You do not have permission to save prescriptions.");
          return;
        }

        // Generate a new prescription ID
        const newId = `RX${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}-${prescriptionHistory.length + 1}`;

        // Add to history
        prescriptionHistory.unshift({
          id: newId,
          date: new Date().toISOString().slice(0, 10),
          patient: document.getElementById("patient-info-name").textContent,
          medications: prescriptionItems.map((item) => item.medication),
          doctor: "Dr. Achieng",
          status: "draft",
          billStatus: "pending",
        });

        renderPrescriptionHistory();
        alert("Prescription saved as draft successfully!");
      }

      // Submit to pharmacy
      function submitToPharmacy() {
        if (!userRoles[currentUserRole].prescriptions.create) {
          alert("You do not have permission to submit prescriptions.");
          return;
        }

        // Generate a new prescription ID
        const newId = `RX${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}-${prescriptionHistory.length + 1}`;

        // Add to history
        prescriptionHistory.unshift({
          id: newId,
          date: new Date().toISOString().slice(0, 10),
          patient: document.getElementById("patient-info-name").textContent,
          medications: prescriptionItems.map((item) => item.medication),
          doctor: "Dr. Achieng",
          status: "submitted",
          billStatus: "pending",
        });

        renderPrescriptionHistory();
        alert("Prescription submitted to pharmacy successfully!");
      }

      // Send to billing
      function sendToBilling() {
        if (!userRoles[currentUserRole].billing.process) {
          alert("You do not have permission to send prescriptions to billing.");
          return;
        }

        alert("Prescription sent to billing successfully!");
      }

      // Print prescription
      function printPrescription() {
        window.print();
      }

      // Export to CSV
      function exportToCSV() {
        if (!userRoles[currentUserRole].prescriptions.export) {
          alert("You do not have permission to export prescriptions.");
          return;
        }

        alert("Exporting to CSV...");
        // In a real app, this would generate and download a CSV file
      }

      // Export to PDF
      function exportToPDF() {
        if (!userRoles[currentUserRole].prescriptions.export) {
          alert("You do not have permission to export prescriptions.");
          return;
        }

        alert("Exporting to PDF...");
        // In a real app, this would generate and download a PDF file
      }

      // Apply filters to history
      function applyFilters() {
        const dateFrom = document.getElementById("history-date-from").value;
        const dateTo = document.getElementById("history-date-to").value;
        const status = document.getElementById("history-status").value;

        // In a real app, this would filter the prescription history
        alert(`Filters applied: ${dateFrom} to ${dateTo}, Status: ${status}`);
      }

      // View prescription details
      function viewPrescription(prescriptionId) {
        const prescription = prescriptionHistory.find(
          (p) => p.id === prescriptionId
        );
        if (prescription) {
          const detailsContainer = document.getElementById(
            "prescription-details"
          );

          // Format date
          const formattedDate = new Date(prescription.date).toLocaleDateString(
            "en-GB",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          );

          detailsContainer.innerHTML = `
            <div class="form-group">
              <label>Prescription ID</label>
              <p>${prescription.id}</p>
            </div>
            <div class="form-group">
              <label>Date</label>
              <p>${formattedDate}</p>
            </div>
            <div class="form-group">
              <label>Patient</label>
              <p>${prescription.patient}</p>
            </div>
            <div class="form-group">
              <label>Medications</label>
              <ul>
                ${prescription.medications
                  .map((med) => `<li>${med}</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="form-group">
              <label>Prescribing Doctor</label>
              <p>${prescription.doctor}</p>
            </div>
            <div class="form-group">
              <label>Status</label>
              <p>${prescription.status}</p>
            </div>
            <div class="form-group">
              <label>Billing Status</label>
              <p>${prescription.billStatus}</p>
            </div>
          `;

          viewPrescriptionModal.style.display = "flex";
        }
      }

      // Reissue prescription
      function reissuePrescription() {
        if (!userRoles[currentUserRole].prescriptions.create) {
          alert("You do not have permission to reissue prescriptions.");
          return;
        }

        alert("Prescription reissued successfully!");
        viewPrescriptionModal.style.display = "none";
      }

      // Apply role permissions
      function applyRolePermissions() {
        const permissions = userRoles[currentUserRole];

        // Show/hide buttons based on permissions
        addMedicationBtn.style.display = permissions.prescriptions.create
          ? "flex"
          : "none";
        saveDraftBtn.style.display = permissions.prescriptions.create
          ? "flex"
          : "none";
        submitPharmacyBtn.style.display = permissions.prescriptions.create
          ? "flex"
          : "none";
        sendBillingBtn.style.display = permissions.billing.process
          ? "flex"
          : "none";
        exportCsvBtn.style.display = permissions.prescriptions.export
          ? "flex"
          : "none";
        exportPdfBtn.style.display = permissions.prescriptions.export
          ? "flex"
          : "none";

        // Update user info based on role
        const userInfo = document.querySelector(".user-details h3");
        if (userInfo) {
          userInfo.textContent = `${
            currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)
          } John`;
        }

        // Update department based on role
        const userDept = document.querySelector(".user-details p");
        if (userDept) {
          if (currentUserRole === "admin") {
            userDept.textContent = "Administration Department";
          } else if (currentUserRole === "doctor") {
            userDept.textContent = "Oncology Department";
          } else if (currentUserRole === "pharmacist") {
            userDept.textContent = "Pharmacy Department";
          } else if (currentUserRole === "cashier") {
            userDept.textContent = "Billing Department";
          }
        }
      }

      // Add role switcher for demonstration (remove in production)
      function addRoleSwitcher() {
        const headerActions = document.querySelector(".header-actions");
        if (!headerActions) return;

        const roleSwitcher = document.createElement("select");
        roleSwitcher.id = "role-switcher";
        roleSwitcher.innerHTML = `
          <option value="admin">Admin</option>
          <option value="doctor" selected>Doctor</option>
          <option value="pharmacist">Pharmacist</option>
          <option value="cashier">Cashier</option>
        `;
        roleSwitcher.value = currentUserRole;
        roleSwitcher.style.marginRight = "10px";
        roleSwitcher.onchange = function () {
          currentUserRole = this.value;
          applyRolePermissions();
        };

        headerActions.insertBefore(roleSwitcher, headerActions.firstChild);
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