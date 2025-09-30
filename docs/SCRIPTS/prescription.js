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
      let medications = []; // empty array initially
async function administerPrescription(prescriptionId, items) {
  if (!selectedPatientId) return alert("Select a patient first.");

  try {
    for (const item of items) {
      const res = await fetch(
        `https://lunar-hmis-backend.onrender.com/api/inventory/dispense/${item.medicationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: item.quantity, patientId: selectedPatientId })
        }
      );

      if (!res.ok) {
        const errMsg = await res.json();
        console.error(`Failed to dispense ${item.medication}: ${errMsg.message}`);
        alert(`Failed to dispense ${item.medication}: ${errMsg.message}`);
      }
    }

    // Refresh stock in the frontend
    await refreshStock();
    alert("Prescription administered and inventory updated successfully.");
  } catch (err) {
    console.error("Error administering prescription:", err);
    alert("Failed to administer prescription due to network error.");
  }
}

// Fetch medications from backend
async function fetchMedications() {
  try {
    //const token = localStorage.getItem("authToken"); // replace with real token
    const res = await fetch("https://lunar-hmis-backend.onrender.com/api/medications", {
      headers: {
        //"Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch medications");

    medications = await res.json(); // should include id, name, stock, price
    renderPrescriptionItems(); // re-render with updated stock
  } catch (err) {
    console.error(err);
    // Optionally display an inline error
    const errorContainer = document.getElementById("error-message");
    if (errorContainer) {
      errorContainer.textContent = "Error fetching medications from backend.";
      errorContainer.style.display = "block";
    }
  }
}

// Call this during init
/*document.addEventListener("DOMContentLoaded", () => {
  fetchMedications();
  init(); // your existing init function
});*/

      // Sample data for prescription history
      let prescriptionHistory = []
      async function fetchPrescriptionHistory() {
  try {
    const res = await fetch('https://lunar-hmis-backend.onrender.com/api/prescriptions', {
  headers: {
    //'Authorization': `Bearer ${token}` // make sure token is set
  }
});


    if (!res.ok) throw new Error('Failed to fetch prescriptions');

    const data = await res.json();

    // Map backend data to format your frontend expects
    prescriptionHistory = data.map(p => ({
      id: p._id,
      date: p.createdAt,
      patient: p.patientId?.name || "N/A",
      medications: p.items.map(item => item.medication),
      doctor: p.doctorId?.name || "N/A",
      status: p.status,
      billStatus: p.billStatus
    }));

    renderPrescriptionHistory(); // re-render table
  } catch (err) {
    console.error(err);
    alert('Error fetching prescription history.');
  }
}


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
        fetchPrescriptionHistory();
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
      option.value = med.id;          // backend _id
      option.textContent = med.name;
      if (item.medicationId === med.id) option.selected = true; // match by ID
      medicationSelect.appendChild(option);
    });

    medicationSelect.addEventListener("change", (e) =>
      updateMedication(index, e.target.value)
    );

    // Build row HTML
    row.innerHTML = `
      <td>
        ${medicationSelect.outerHTML}
        ${getStockWarning(item.medicationId)}
      </td>
      <td><input type="text" value="${item.dosage || ""}" placeholder="Dosage" onchange="updateDosage(${index}, this.value)"></td>
      <td>
        <select onchange="updateFrequency(${index}, this.value)">
          <option value="once" ${item.frequency === "once" ? "selected" : ""}>Once daily</option>
          <option value="twice" ${item.frequency === "twice" ? "selected" : ""}>Twice daily</option>
          <option value="thrice" ${item.frequency === "thrice" ? "selected" : ""}>Three times daily</option>
          <option value="four" ${item.frequency === "four" ? "selected" : ""}>Four times daily</option>
          <option value="asneeded" ${item.frequency === "asneeded" ? "selected" : ""}>As needed</option>
        </select>
      </td>
      <td><input type="text" value="${item.duration || ""}" placeholder="Duration" onchange="updateDuration(${index}, this.value)"></td>
      <td><input type="number" value="${item.quantity || 1}" min="1" style="width: 60px" onchange="updateQuantity(${index}, this.value)"></td>
      <td><input type="text" value="${item.instructions || ""}" placeholder="Instructions" onchange="updateInstructions(${index}, this.value)"></td>
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
function getStockWarning(medicationId) {
  // Find the medication in the local array using its ID
  const medication = medications.find(m => m.id === medicationId);
  if (!medication) return "";

  // Show a warning if stock is low
  if (medication.quantity < 20) {
    return `
      <div class="stock-warning">
        <i class="fas fa-exclamation-circle"></i> Low stock: ${medication.quantity} remaining
      </div>
    `;
  }

  return ""; // No warning if stock is sufficient
}


// Example: refresh stock after submitting prescription
async function refreshStock() {
  try {
    ///const token = localStorage.getItem("authToken"); // your JWT
    const res = await fetch("https://lunar-hmis-backend.onrender.com/api/medications")/*, {
      headers: //{ "Authorization": `Bearer ${token}` }
    });*/
    if (!res.ok) throw new Error("Failed to fetch stock");

    medications = await res.json();
    renderPrescriptionItems(); // re-render table with updated stock
  } catch (err) {
    console.error(err);
  }
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
    // Update prescription item
    prescriptionItems[index].medicationId = medication.id; // store ID
    prescriptionItems[index].medication = medication.name; // store name for UI

    // Update stock warning safely
    const row = prescriptionItemsContainer.rows[index];
    if (row) {
      let warningDiv = row.querySelector(".stock-warning");
      if (!warningDiv) {
        warningDiv = document.createElement("div");
        warningDiv.className = "stock-warning";
        row.cells[0].appendChild(warningDiv);
      }
      // ✅ Pass medication ID, not name
      warningDiv.innerHTML = getStockWarning(medication.id);
    }

    // Check drug interactions
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
        prescriptionItems[index].quantity = parseInt(quantity) || 1;
      }

      // Update instructions
      function updateInstructions(index, instructions) {
        prescriptionItems[index].instructions = instructions;
      }

      // Check for drug interactions
      function checkDrugInteractions() {
        // Simple interaction check - in a real app, this would be more sophisticated
       const currentMeds = document.getElementById("patient-info-current-meds")?.textContent || "";
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
      //let selectedPatientId = ""; // global variable
// Global variables
let patients = []; // fetched from backend
let selectedPatientId = ""; // currently selected patient

// Fetch patients from backend
async function fetchPatients() {
  try {
    // const token = localStorage.getItem("authToken"); // uncomment for auth
    const res = await fetch("https://lunar-hmis-backend.onrender.com/api/patients", {
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to fetch patients");

    patients = await res.json();

    // Populate the select dropdown
    const patientSelect = document.getElementById("patient-select");
    if (!patientSelect) return;

    patientSelect.innerHTML = `<option value="">Select Patient</option>`; // default
    patients.forEach(p => {
      const option = document.createElement("option");
      option.value = p._id; // backend MongoDB ID
      option.textContent = p.name; // display name
      patientSelect.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    const errorContainer = document.getElementById("error-message");
    if (errorContainer) {
      errorContainer.textContent = "Error fetching patients from backend.";
      errorContainer.style.display = "block";
    }
  }
}
// Update patient info when selection changes
function updatePatientInfo() {
  const patientSelect = document.getElementById("patient-select");
  const selectedId = patientSelect.value;

  const patient = patients.find(p => p._id === selectedId);

  if (patient) {
    selectedPatientId = patient._id;

    document.getElementById("patient-info-name").textContent = patient.name || "N/A";
    document.getElementById("patient-info-id").textContent = patient.patientCode || "N/A";
    document.getElementById("patient-info-age").textContent = `${patient.age || "N/A"} years, ${patient.gender || "N/A"}`;
    document.getElementById("patient-info-last-visit").textContent = patient.lastVisit || "N/A";
    document.getElementById("patient-info-allergies").textContent = patient.allergies?.join(", ") || "None";
    document.getElementById("patient-info-current-meds").textContent = patient.currentMeds?.join(", ") || "None";
  } else {
    selectedPatientId = "";
    document.getElementById("patient-info-name").textContent = "";
    document.getElementById("patient-info-id").textContent = "";
    document.getElementById("patient-info-age").textContent = "";
    document.getElementById("patient-info-last-visit").textContent = "";
    document.getElementById("patient-info-allergies").textContent = "";
    document.getElementById("patient-info-current-meds").textContent = "";
  }

  // Check for drug interactions after selection
  checkDrugInteractions();
}

// Initialize patients and attach listener
function initPatients() {
  fetchPatients();
  const patientSelect = document.getElementById("patient-select");
  if (patientSelect) {
    patientSelect.addEventListener("change", updatePatientInfo);
  }
}

// Call this inside your main init function
document.addEventListener("DOMContentLoaded", () => {
  initPatients();
});
   // Save prescription as draft
async function saveDraft() {
  if (!userRoles[currentUserRole].prescriptions.create) {
    alert("You do not have permission to save prescriptions.");
    return;
  }

  // Filter out invalid items
  const medicationsList = prescriptionItems.filter(
    item => item.medicationId && item.quantity > 0
  );

  if (!selectedPatientId || medicationsList.length === 0) {
    alert("Please select a patient and add at least one medication.");
    return;
  }

  // Validate that all medication IDs exist in backend stock
  const invalidMeds = medicationsList.filter(
    item => !medications.find(m => m.id === item.medicationId)
  );

  if (invalidMeds.length > 0) {
    alert(
      `Some medications are invalid or not in stock: ${invalidMeds
        .map(i => i.medication)
        .join(", ")}`
    );
    return;
  }

  const payload = {
    patientId: selectedPatientId,
    items: medicationsList.map(item => ({
      medicationId: item.medicationId,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      instructions: item.instructions
    })),
    status: "draft",
    billStatus: "pending"
  };

  try {
    const res = await fetch(
      "https://lunar-hmis-backend.onrender.com/api/prescriptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to save draft");
    }

    await res.json();
    alert("Prescription saved as draft successfully!");
    await fetchPrescriptionHistory();
  } catch (err) {
    console.error(err);
    alert(`Failed to save draft: ${err.message}`);
  }
}



// Submit prescription to pharmacy
// Global token (replace with your real token)


// Submit prescription to pharmacy
async function submitToPharmacy() {
  // Permission check
  if (!userRoles[currentUserRole].prescriptions.create) {
    alert("You do not have permission to submit prescriptions.");
    return;
  }

  const patientName = document.getElementById("patient-info-name")?.textContent || "";
  const medicationsList = prescriptionItems.filter(
    item => item.medicationId && item.quantity > 0
  );

  if (!selectedPatientId || medicationsList.length === 0) {
    alert("Please select a patient and add at least one medication.");
    return;
  }

  // Validate medication IDs against local stock
  const invalidMeds = medicationsList.filter(
    item => !medications.find(m => m.id === item.medicationId)
  );
  if (invalidMeds.length > 0) {
    alert(
      `Some medications are invalid or not in stock: ${invalidMeds
        .map(i => i.medication)
        .join(", ")}`
    );
    return;
  }

  const payload = {
    patientId: selectedPatientId,
    items: medicationsList.map(item => ({
      medicationId: item.medicationId,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      quantity: item.quantity,
      instructions: item.instructions
    })),
    status: "submitted",
    billStatus: "pending"
  };

  try {
    // Submit prescription to backend
    const res = await fetch('https://lunar-hmis-backend.onrender.com/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to submit prescription");
    }

    const savedPrescription = await res.json();
    alert("Prescription submitted to pharmacy successfully!");

    // Refresh prescription history
    await fetchPrescriptionHistory();

    // Pharmacist auto-dispense & update inventory
    if (currentUserRole === "pharmacist") {
      await administerPrescription(savedPrescription._id, medicationsList);
    } else {
      await refreshStock(); // just refresh stock for other roles
    }

  } catch (err) {
    console.error(err);
    alert(`Error submitting prescription: ${err.message}`);
  }
}



// Reissue prescription
async function reissuePrescription() {
  if (!userRoles[currentUserRole].prescriptions.edit && !userRoles[currentUserRole].prescriptions.dispense) {
  alert("You do not have permission to reissue prescriptions.");
  return;
}


  const prescriptionIdElement = document.getElementById("prescription-id");
  if (!prescriptionIdElement) {
    alert("Prescription ID not found. Please open a prescription first.");
    return;
  }
  const prescriptionId = prescriptionIdElement.textContent;

  try {
   const res = await fetch(`https://lunar-hmis-backend.onrender.com/api/prescriptions/${prescriptionId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    //'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ status: "submitted" })
});


    if (!res.ok) throw new Error("Failed to reissue prescription");
    const data = await res.json();
    alert("Prescription reissued successfully!");
    
    // Close modal and refresh history
    if (viewPrescriptionModal) viewPrescriptionModal.style.display = "none";
    await fetchPrescriptionHistory();
  } catch (err) {
    console.error(err);
    alert("Error reissuing prescription.");
  }
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
    // View prescription details from backend
async function viewPrescription(prescriptionId) {
  const detailsContainer = document.getElementById("prescription-details");

  try {
    const res = await fetch(`https://lunar-hmis-backend.onrender.com/api/prescriptions/${prescriptionId}`)/*, {
  headers: //{ 'Authorization': `Bearer ${token}` }
});*/


    if (!res.ok) throw new Error("Failed to fetch prescription");

    const prescription = await res.json();

    // Format date
    const formattedDate = new Date(prescription.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Render prescription details
    detailsContainer.innerHTML = `
      <div class="form-group">
        <label>Prescription ID</label>
        <p id="prescription-id">${prescription._id}</p>
      </div>
      <div class="form-group">
        <label>Date</label>
        <p>${formattedDate}</p>
      </div>
      <div class="form-group">
        <label>Patient</label>
        <p>${prescription.patientId?.name || "N/A"}</p>
      </div>
      <div class="form-group">
        <label>Medications</label>
        <ul>
          // example in viewPrescription()
${prescription.items.map(item => `
  <li>
    ${item.medication?.name || "Unknown"} - ${item.dosage}, ${item.frequency}, ${item.duration}, Qty: ${item.quantity}
    <br><small>${item.instructions}</small>
  </li>`).join("")}

        </ul>
      </div>
      <div class="form-group">
        <label>Prescribing Doctor</label>
        <p>${prescription.doctorId?.name || "N/A"}</p>
      </div>
      <div class="form-group">
        <label>Status</label>
        <p>${prescription.status}</p>
      </div>
      <div class="form-group">
        <label>Billing Status</label>
        <p>${prescription.billStatus || "pending"}</p>
      </div>
    `;

    // Show modal
    const viewPrescriptionModal = document.getElementById("view-prescription-modal");
    if (viewPrescriptionModal) viewPrescriptionModal.style.display = "flex";

  } catch (err) {
    console.error(err);
    alert("Error fetching prescription details.");
  }
}


      /* Reissue prescription
      function reissuePrescription() {
        if (!userRoles[currentUserRole].prescriptions.create) {
          alert("You do not have permission to reissue prescriptions.");
          return;
        }

        alert("Prescription reissued successfully!");
        viewPrescriptionModal.style.display = "none";
      }*/

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