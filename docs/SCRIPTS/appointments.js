// ==========================
// appointments.js (Clean & Fully Fixed)
// ==========================
async function loadDoctorsAndNurses() {
  try {
    const res = await fetch(`${API_BASE}/api/staff`);
    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to fetch staff:", data);
      return;
    }

    // Filter doctors and nurses only
    const medicalStaff = data.filter(
      (s) => s.role.toLowerCase().includes("doctor") || s.role.toLowerCase().includes("nurse")
    );

    // Get both dropdowns
    const formDoctorSelect = document.getElementById("doctor");
    const filterDoctorSelect = document.getElementById("filter-doctor");

    // Clear current options
    if (formDoctorSelect) formDoctorSelect.innerHTML = `<option value="">Select Doctor/Nurse</option>`;
    if (filterDoctorSelect) filterDoctorSelect.innerHTML = `<option value="">All Doctors</option>`;

    // Populate both dropdowns with real data
    medicalStaff.forEach((staff) => {
      const option = document.createElement("option");
      option.value = staff._id; // ✅ use ObjectId
      option.textContent = `${staff.firstName} ${staff.lastName || ""} (${staff.role})`;


      const filterOption = option.cloneNode(true);

      if (formDoctorSelect) formDoctorSelect.appendChild(option);
      if (filterDoctorSelect) filterDoctorSelect.appendChild(filterOption);
    });

    console.log("✅ Loaded doctors/nurses:", medicalStaff);
  } catch (err) {
    console.error("💥 Error loading staff:", err);
  }
}

import { staffList, loadStaff, populateStaffDropdown } from "./sharedStaff.js";

const API_BASE = "https://lunar-hmis-backend.onrender.com";

// Global state
let appointments = [];
let currentPage = 1;
const rowsPerPage = 5;
let currentSort = { column: "date", order: "asc" };
let editId = null; // Track appointment being edited

// ==========================
// Fetch Appointments
// ==========================
async function fetchAppointments(patientId = null) {
  try {
    let url = `${API_BASE}/api/appointments`;
    if (patientId) url += `/patient/${patientId}`;

    // ✅ Get token from localStorage
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    const appointmentsData = data.appointments || data;

    // ✅ Preserve full doctor object instead of flattening it
    appointments = appointmentsData.map(a => ({
      id: a._id,
      patientId: a.patient?._id || "",
      patient: a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "Unknown",
      doctorId: a.doctor?._id || "",
      doctor: a.doctor || null, // keep the full doctor object here
      date: a.date,
      time: a.time,
      department: a.department || a.doctor?.department || "",
      status: a.status,
      type: a.type || "",
      reason: a.reason || "",
      symptoms: a.symptoms || "",
      diagnosis: a.diagnosis || "",
      treatment: a.treatment || "",
      prescription: a.prescription || "",
      billingAmount: a.billingAmount || 0,
      billingStatus: a.billingStatus || "unpaid",
      paymentMethod: a.paymentMethod || "",
      insuranceProvider: a.insuranceProvider || ""
    }));

    console.log("✅ Appointments fetched:", appointments); // for debugging
    renderTable();
  } catch (err) {
    console.error("Error fetching appointments:", err);
    alert("Failed to load appointments. Please try again later.");
  }
}


// ==========================
// Render Table
// ==========================
function renderTable() {
  const tbody = document.querySelector(".appointments-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Get search and filter values safely
  const searchTerm = document.getElementById("search-term")?.value.toLowerCase() || "";
  const filterDoctor = document.getElementById("filter-doctor")?.value || "";
  const filterStatus = document.getElementById("filter-status")?.value || "";

  // ----------------------------
  // ✅ Filtering logic
  // ----------------------------
  let filtered = appointments.filter(a => {
    const patientMatch =
      a.patient?.toLowerCase().includes(searchTerm) ||
      a.id?.toLowerCase().includes(searchTerm);

    const doctorMatch =
      filterDoctor === "" ||
      a.doctorId === filterDoctor ||
      (typeof a.doctor === "string" && a.doctor === filterDoctor) ||
      (typeof a.doctor === "object" && a.doctor?._id === filterDoctor);

    const statusMatch = filterStatus === "" || a.status === filterStatus;

    return patientMatch && doctorMatch && statusMatch;
  });

  // ----------------------------
  // ✅ Sorting logic
  // ----------------------------
  filtered.sort((a, b) => {
    let valA = a[currentSort.column];
    let valB = b[currentSort.column];

    if (currentSort.column === "date") {
      valA = new Date(`${a.date} ${a.time}`);
      valB = new Date(`${b.date} ${b.time}`);
    }

    if (valA < valB) return currentSort.order === "asc" ? -1 : 1;
    if (valA > valB) return currentSort.order === "asc" ? 1 : -1;
    return 0;
  });

  // ----------------------------
  // ✅ Pagination logic
  // ----------------------------
  const pageCount = Math.ceil(filtered.length / rowsPerPage);
  if (currentPage > pageCount) currentPage = pageCount || 1;
  const start = (currentPage - 1) * rowsPerPage;
  const paginated = filtered.slice(start, start + rowsPerPage);

  // ----------------------------
  // ✅ Render each row safely
  // ----------------------------
  paginated.forEach(a => {
    const tr = document.createElement("tr");
    tr.dataset.id = a.id;

    // Safely handle doctor info
    let doctorName = "Not assigned";
    let doctorRole = "Not assigned";

    if (typeof a.doctor === "object" && a.doctor !== null) {
      doctorName = a.doctor.name || "Unknown";
      doctorRole = a.doctor.role || "Not assigned";
    } else if (typeof a.doctor === "string") {
      doctorName = a.doctor;
    }

    // Safely handle patient info
    const patientName = a.patient || "Unknown";
    const formattedDate = formatDateTime(a.date, a.time);

    // Build table row
    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${patientName}</td>
      <td>${doctorName} <small class="text-muted">(${doctorRole})</small></td>
      <td>${formattedDate}</td>
      <td>${a.department || "N/A"}</td>
      <td>
        <span class="status-badge status-${a.status?.toLowerCase().replace(/\s/g, '-') || 'unknown'}">
          ${a.status || "Unknown"}
        </span>
      </td>
      <td><span class="billing-status">${a.billingAmount || 0}</span></td>
      <td class="action-cell">
        <button class="action-btn btn-view"><i class="fas fa-eye"></i> View</button>
        <button class="action-btn btn-edit"><i class="fas fa-edit"></i> Edit</button>
        <button class="action-btn btn-cancel"><i class="fas fa-times"></i> Cancel</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Render pagination
  renderPagination(filtered.length);
}


const tbody = document.querySelector(".appointments-table tbody");

tbody.addEventListener("click", async (e) => {
  const tr = e.target.closest("tr");
  if (!tr) return;
  const id = tr.dataset.id;

  if (e.target.closest(".btn-view")) {
    viewAppointment(id);
  }

  if (e.target.closest(".btn-edit")) {
    await editAppointment(id);
  }

  if (e.target.closest(".btn-cancel")) {
    cancelAppointment(id);
  }
});
// ==========================
// Pagination
// ==========================
function renderPagination(total) {
  const pageCount = Math.ceil(total / rowsPerPage);
  const paginationControls = document.querySelector(".pagination-controls");
  if (!paginationControls) return;
  paginationControls.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.className = "pagination-btn";
  prevBtn.textContent = "« Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => { currentPage--; renderTable(); };
  paginationControls.appendChild(prevBtn);

  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement("button");
    btn.className = "pagination-btn" + (i === currentPage ? " active" : "");
    btn.textContent = i;
    btn.onclick = () => { currentPage = i; renderTable(); };
    paginationControls.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "pagination-btn";
  nextBtn.textContent = "Next »";
  nextBtn.disabled = currentPage === pageCount;
  nextBtn.onclick = () => { currentPage++; renderTable(); };
  paginationControls.appendChild(nextBtn);

  const pageInfo = document.querySelector(".pagination-info");
  if (pageInfo) {
    pageInfo.textContent =
      `Showing ${Math.min((currentPage-1)*rowsPerPage+1,total)}-${Math.min(currentPage*rowsPerPage,total)} of ${total} appointments`;
  }
}

// ==========================
// Utilities
// ==========================
function formatDateTime(date, time) {
  if (!date) return "-";
  const d = new Date(date + "T" + (time || "00:00"));
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) + ", " +
         d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

// ==========================
// Search & Sort
// ==========================
const searchBtn = document.querySelector(".search-btn");
if (searchBtn) searchBtn.addEventListener("click", () => {
  currentPage = 1;
  renderTable();
});

const tableActionSelect = document.querySelector(".table-actions select");
if (tableActionSelect) tableActionSelect.addEventListener("change", (e) => {
  const value = e.target.value;
  switch(value){
    case "Sort by: Date (Newest First)": currentSort={column:"date", order:"desc"}; break;
    case "Sort by: Date (Oldest First)": currentSort={column:"date", order:"asc"}; break;
    case "Sort by: Patient Name": currentSort={column:"patient", order:"asc"}; break;
    case "Sort by: Doctor": currentSort={column:"doctor", order:"asc"}; break;
  }
  renderTable();
});

// ==========================
// Modal
// ==========================
async function openModal() {
  const modal = document.getElementById("appointmentModal");
  if (!modal) return;
  modal.style.display = "block";
  await populateDropdowns();
}

function closeModal() {
  const modal = document.getElementById("appointmentModal");
  if (modal) modal.style.display = "none";
  clearModal();
}

function clearModal() {
  const fields = [
    "patient", "doctor", "appointment-date", "appointment-time",
    "department", "appointment-type", "reason", "symptoms",
    "diagnosis", "treatment", "prescription", "consultation-fee",
    "billing-status", "payment-method", "insurance-provider"
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = id === "billing-status" ? "unpaid" : "";
  });
  editId = null;
}

// ==========================
// Populate Dropdowns
// ==========================
async function populateDropdowns() {
  try {
    // ---------- Patients ----------
    const patientRes = await fetch(`${API_BASE}/api/patients`);
    const patientsData = await patientRes.json();
    const patients = patientsData.patients || [];
    const patientSelect = document.getElementById("patient");
    if (patientSelect) {
      patientSelect.innerHTML = '<option value="">Select Patient</option>';
      patients.forEach(p => {
        const option = document.createElement("option");
        option.value = p._id;
        option.textContent = `${p.firstName} ${p.lastName} (${p.patientId || p._id})`;
        patientSelect.appendChild(option);
      });
    }

    // ---------- Doctors / Staff ----------
    // Load staff only if not loaded yet
    if (staffList.length === 0) await loadStaff();
    // Populate only doctors/nurses in the dropdown
    populateStaffDropdown("doctor", ["doctor", "nurse"]);

  } catch (err) {
    console.error("Error populating dropdowns:", err);
    alert("Failed to load patients or staff. Please try again later.");
  }
}

// ==========================
// Save Appointment
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.querySelector("#appointmentModal .btn-primary");
if (!saveBtn) return;

saveBtn.addEventListener("click", async () => {
  // --------------------------
  // Build payload from form fields
  // --------------------------
  const payload = {
    patient: document.getElementById("patient").value,
    doctor: document.getElementById("doctor").value || null,
    date: document.getElementById("appointment-date").value,
    time: document.getElementById("appointment-time").value,
    department: document.getElementById("department").value,
    type: document.getElementById("appointment-type").value,
    reason: document.getElementById("reason").value,
    symptoms: document.getElementById("symptoms")?.value || "",
    diagnosis: document.getElementById("diagnosis")?.value || "",
    treatment: document.getElementById("treatment")?.value || "",
    prescription: document.getElementById("prescription")?.value || "",
    billingAmount: Number(document.getElementById("consultation-fee")?.value) || 0,
    billingStatus: document.getElementById("billing-status")?.value || "unpaid",
    paymentMethod: document.getElementById("payment-method")?.value || "",
    insuranceProvider: document.getElementById("insurance-provider")?.value || ""
  };

  // --------------------------
  // Validate required fields
  // --------------------------
  if (!payload.patient || !payload.date || !payload.time || !payload.department) {
    alert("Please fill all required fields (Patient, Date, Time, Department)");
    return;
  }

  console.log("🧾 Payload to be saved:", payload);

  try {
    // --------------------------
    // JWT token from localStorage
    // --------------------------
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User is not authenticated. Please log in.");

    // --------------------------
    // Determine URL and method
    // --------------------------
    const url = editId
      ? `${API_BASE}/api/appointments/${editId}`
      : `${API_BASE}/api/appointments`;
    const method = editId ? "PUT" : "POST";

    // --------------------------
    // Send request with Authorization header
    // --------------------------
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("❌ Server responded with error:", res.status, data);
      throw new Error(data?.message || `Failed to save appointment (${res.status})`);
    }

    console.log("✅ Appointment saved successfully:", data);

    // Refresh table and close modal
    await fetchAppointments();
    closeModal();
    editId = null;
  } catch (err) {
    console.error("💥 Failed to save appointment:", err);
    alert("Error saving appointment: " + (err.message || "Unknown error"));
  }
});
});


 // Close modal button
  const closeBtn = document.getElementById("btnCloseModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

 // ==========================
 // View / Edit / Cancel
 // ==========================
 function viewAppointment(id) {
  const app = appointments.find(a => a.id === id);
  if (!app) return;

  // ✅ Safely extract doctor info
  const doctorName = app.doctor?.name || app.doctor || "Not assigned";
  const doctorRole = app.doctor?.role || "Not assigned";

  console.log("Viewing appointment — Doctor role:", doctorRole);

  alert(
    `Viewing appointment for ${app.patient} with ${doctorName} (${doctorRole}) on ${formatDateTime(app.date, app.time)}`
  );
 }


 async function editAppointment(id) {
  // Find the appointment in local state
  const app = appointments.find(a => a.id === id);
  if (!app) return;

  // Log doctor info for debugging
  const doctorName = app.doctor?.name || "Not assigned";
  const doctorRole = app.doctor?.role || "Not assigned";
  console.log(`Editing appointment — Doctor: ${doctorName}, Role: ${doctorRole}`);

  // Open modal and populate fields
  await openAppointmentModal(app);

  // Preselect doctor dropdown safely
  const doctorSelect = document.getElementById("doctor");
  if (doctorSelect) doctorSelect.value = app.doctor?._id || "";

  // Preselect patient dropdown safely
  const patientSelect = document.getElementById("patient");
  if (patientSelect) patientSelect.value = app.patientId || "";

  // Track which appointment is being edited
  editId = id;
}





 async function cancelAppointment(id) {
  if (!id) return;

  // Find the appointment in local state for display purposes
  const app = appointments.find(a => a.id === id);
  if (!app) return;

  // Safely get doctor info
  const doctorName = app.doctor?.name || "Not assigned";
  const doctorRole = app.doctor?.role || "Not assigned";

  if (confirm(`Are you sure you want to cancel the appointment for ${app.patient} with ${doctorName} (${doctorRole})?`)) {
    try {
      // ✅ Get JWT token from localStorage
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated. Please log in.");

      // Send request to update appointment status
      const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` // ✅ include token
        },
        body: JSON.stringify({ status: "cancelled" }) // match your schema's enum
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `Failed to cancel appointment (${res.status})`);
      }

      alert("Appointment cancelled successfully");
      await fetchAppointments(); // refresh the table
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Error cancelling appointment: " + (err.message || "Unknown error"));
    }
  }
}




// ==========================
// Export CSV
// ==========================
const btnCSV = document.querySelector(".btn-success");
if (btnCSV) btnCSV.addEventListener("click", () => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Appointment ID,Patient,Doctor,Date,Time,Department,Status,Billing\n";
  appointments.forEach(a => {
    csvContent += `${a.id},${a.patient},${a.doctor},${a.date},${a.time},${a.department},${a.status},${a.billingAmount}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "appointments.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ==========================
// Print Schedule
// ==========================
const btnPrint = document.querySelector(".btn-warning");
if (btnPrint) btnPrint.addEventListener("click", () => {
  let printContent = "<h2>Appointments Schedule</h2><table border='1' cellpadding='5'><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Department</th><th>Status</th></tr>";
  appointments.forEach(a => {
    printContent += `<tr>
      <td>${a.id}</td>
      <td>${a.patient}</td>
      <td>${a.doctor}</td>
      <td>${a.date}</td>
      <td>${a.time}</td>
      <td>${a.department}</td>
      <td>${a.status}</td>
    </tr>`;
  });
  printContent += "</table>";
  const newWin = window.open("");
  newWin.document.write(printContent);
  newWin.print();
});

// ==========================
// Tabs
// ==========================
function openTab(event, tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  if(event.currentTarget) event.currentTarget.classList.add("active");

  document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
  const tabContent = document.getElementById(tabId);
  if(tabContent) tabContent.classList.add("active");
}

// ==========================
// View Toggle
// ==========================
function toggleView(view) {
  const listBtn = document.getElementById("listViewBtn");
  const calendarBtn = document.getElementById("calendarViewBtn");
  const listContainer = document.querySelector(".appointments-table-container");
  const calendarContainer = document.getElementById("calendarContainer");

  if(view === "list") {
    if(listContainer) listContainer.style.display = "block";
    if(calendarContainer) calendarContainer.style.display = "none";
    if(listBtn){ listBtn.style.backgroundColor="#007bff"; listBtn.style.color="white"; }
    if(calendarBtn){ calendarBtn.style.backgroundColor="#f0f0f0"; calendarBtn.style.color="#333"; }
  } else if(view === "calendar") {
    if(listContainer) listContainer.style.display = "none";
    if(calendarContainer) calendarContainer.style.display = "block";
    if(calendarBtn){ calendarBtn.style.backgroundColor="#007bff"; calendarBtn.style.color="white"; }
    if(listBtn){ listBtn.style.backgroundColor="#f0f0f0"; listBtn.style.color="#333"; }
    if(typeof renderCalendar === "function") renderCalendar();
  }
}

// ==========================
// Render Calendar
// ==========================
function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  if(!calendarEl) return;
  calendarEl.innerHTML = "";
  appointments.forEach(app => {
    const div = document.createElement("div");
    div.textContent = `${app.date} ${app.time} - ${app.patient} with ${app.doctor}`;
    div.classList.add("calendar-event");
    calendarEl.appendChild(div);
  });
}

// ==========================
// Open Appointment Modal
// ==========================
async function openAppointmentModal(appointment = null) {
  // Track the appointment being edited
  editId = appointment?.id || null;

  // Populate dropdowns first
  await populateDropdowns();

  // List of modal fields
  const fields = [
    "patient", "doctor", "appointment-date", "appointment-time",
    "department", "appointment-type", "reason", "symptoms",
    "diagnosis", "treatment", "prescription", "consultation-fee",
    "billing-status", "payment-method", "insurance-provider"
  ];

  // Clear fields if creating a new appointment
  if (!appointment) {
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = id === "billing-status" ? "unpaid" : "";
    });
  }

  // Populate fields if editing
  if (appointment) {
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      switch (id) {
        case "patient":
          el.value = appointment.patientId || "";
          break;
        case "doctor":
          el.value = appointment.doctor?._id || "";
          break;
        case "appointment-date":
          el.value = appointment.date ? appointment.date.split('T')[0] : "";
          break;
        case "appointment-time":
          el.value = appointment.time || "";
          break;
        case "department":
          el.value = appointment.department || "";
          break;
        case "appointment-type":
          el.value = appointment.type || "";
          break;
        case "reason":
        case "symptoms":
        case "diagnosis":
        case "treatment":
        case "prescription":
          el.value = appointment[id] || "";
          break;
        case "consultation-fee":
          el.value = appointment.billingAmount || 0;
          break;
        case "billing-status":
          el.value = appointment.billingStatus || "unpaid";
          break;
        case "payment-method":
          el.value = appointment.paymentMethod || "";
          break;
        case "insurance-provider":
          el.value = appointment.insuranceProvider || "";
          break;
      }
    });
  }

  // Update modal title
  const modalTitle = document.querySelector("#appointmentModal .modal-title");
  if (modalTitle) modalTitle.textContent = appointment ? "Edit Appointment" : "Create New Appointment";

  // Show modal
  const modal = document.getElementById("appointmentModal");
  if (modal) modal.classList.add("active");
}


// ==========================
// Logout
// ==========================
function logout() {
  localStorage.removeItem("token");
  sessionStorage.clear();
  window.location.href = "/HTML/index.html";
  console.log("User logged out successfully");
}

// ==========================
// Initial Render
// ==========================
fetchAppointments();
// Expose functions to global scope for inline onclick
window.openModal = openModal;
window.closeModal = closeModal;
window.viewAppointment = viewAppointment;
window.editAppointment = editAppointment;
window.cancelAppointment = cancelAppointment;
//window.createAppointment = createAppointment;
window.toggleView = toggleView;
window.openTab = openTab;
document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.querySelector(".btn-primary");
  if(createBtn) createBtn.addEventListener("click", openModal);
});


