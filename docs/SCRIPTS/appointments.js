// ==========================
// appointments.js (Clean & Fully Fixed)
// ==========================
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

    const res = await fetch(url);
    const data = await res.json();
    const appointmentsData = data.appointments || data;

    appointments = appointmentsData.map(a => ({
      id: a._id,
      patientId: a.patient?._id || "",
      patient: a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "Unknown",
      doctorId: a.doctor?._id || "",
      doctor: a.doctor?.name || "Unassigned",
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

  const searchTermEl = document.getElementById("search-term");
  const searchTerm = searchTermEl ? searchTermEl.value.toLowerCase() : "";
  const filterDoctorEl = document.getElementById("filter-doctor");
  const filterDoctor = filterDoctorEl ? filterDoctorEl.value : "";
  const filterStatusEl = document.getElementById("filter-status");
  const filterStatus = filterStatusEl ? filterStatusEl.value : "";

  let filtered = appointments.filter(a =>
    (a.patient.toLowerCase().includes(searchTerm) || a.id.toLowerCase().includes(searchTerm)) &&
    (filterDoctor === "" || a.doctor === filterDoctor) &&
    (filterStatus === "" || a.status === filterStatus)
  );

  // Sorting
  filtered.sort((a, b) => {
    let valA = a[currentSort.column];
    let valB = b[currentSort.column];
    if (currentSort.column === "date") {
      valA = new Date(a.date + " " + a.time);
      valB = new Date(b.date + " " + b.time);
    }
    if (valA < valB) return currentSort.order === "asc" ? -1 : 1;
    if (valA > valB) return currentSort.order === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const pageCount = Math.ceil(filtered.length / rowsPerPage);
  if (currentPage > pageCount) currentPage = pageCount || 1;
  const start = (currentPage - 1) * rowsPerPage;
  const paginated = filtered.slice(start, start + rowsPerPage);

  paginated.forEach(a => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.patient}</td>
      <td>${a.doctor}</td>
      <td>${formatDateTime(a.date, a.time)}</td>
      <td>${a.department}</td>
      <td><span class="status-badge status-${a.status.toLowerCase().replace(/\s/g,'-')}">${a.status}</span></td>
      <td><span class="billing-status">${a.billingAmount}</span></td>
      <td class="action-cell">
        <button class="action-btn btn-view" onclick="viewAppointment('${a.id}')"><i class="fas fa-eye"></i> View</button>
        <button class="action-btn btn-edit" onclick="editAppointment('${a.id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="action-btn btn-cancel" onclick="cancelAppointment('${a.id}')"><i class="fas fa-times"></i> Cancel</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination(filtered.length);
}

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

    const doctorRes = await fetch(`${API_BASE}/api/doctors`);
    const doctorsData = await doctorRes.json();
    const doctors = doctorsData.doctors || [];
    const doctorSelect = document.getElementById("doctor");
    if (doctorSelect) {
      doctorSelect.innerHTML = '<option value="">Select Doctor/Nurse</option>';
      doctors.forEach(d => {
        const option = document.createElement("option");
        option.value = d._id;
        option.textContent = d.name + (d.role ? ` (${d.role})` : '');
        doctorSelect.appendChild(option);
      });
    }

  } catch (err) {
    console.error("Error populating dropdowns:", err);
    alert("Failed to load patients or doctors. Please try again later.");
  }
}

// ==========================
// Save Appointment
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.querySelector("#appointmentModal .btn-primary");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", async () => {
    const payload = {
      patient: document.getElementById("patient").value,
      doctor: document.getElementById("doctor").value,
      date: document.getElementById("appointment-date").value,
      time: document.getElementById("appointment-time").value,
      department: document.getElementById("department").value,
      type: document.getElementById("appointment-type").value,
      reason: document.getElementById("reason").value,
      symptoms: document.getElementById("symptoms").value,
      diagnosis: document.getElementById("diagnosis").value,
      treatment: document.getElementById("treatment").value,
      prescription: document.getElementById("prescription").value,
      billingAmount: Number(document.getElementById("consultation-fee").value) || 0,
      billingStatus: document.getElementById("billing-status").value,
      paymentMethod: document.getElementById("payment-method").value,
      insuranceProvider: document.getElementById("insurance-provider").value
    };

    if (!payload.patient || !payload.doctor || !payload.date || !payload.time || !payload.department) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const url = editId
        ? `${API_BASE}/api/appointments/${editId}`
        : `${API_BASE}/api/appointments`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save appointment");

      await fetchAppointments();
      closeModal();
      editId = null;
    } catch (err) {
      console.error(err);
      alert("Error saving appointment: " + err.message);
    }
  });
});

// ==========================
// View / Edit / Cancel
// ==========================
function viewAppointment(id) {
  const app = appointments.find(a => a.id === id);
  if (!app) return;
  alert(`Viewing appointment for ${app.patient} with ${app.doctor} on ${formatDateTime(app.date, app.time)}`);
}

async function editAppointment(id) {
  const app = appointments.find(a => a.id === id);
  if (!app) return;
  await openAppointmentModal(app);
  editId = id;
}

async function cancelAppointment(id) {
  if(confirm("Are you sure you want to cancel this appointment?")){
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Canceled" })
      });
      if (!res.ok) throw new Error("Failed to cancel appointment");
      await fetchAppointments();
    } catch (err) {
      alert("Error cancelling appointment: " + err.message);
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
  editId = appointment?._id || null;
  await populateDropdowns();

  const fields = [
    "patient", "doctor", "appointment-date", "appointment-time",
    "department", "appointment-type", "reason", "symptoms",
    "diagnosis", "treatment", "prescription", "consultation-fee",
    "billing-status", "payment-method", "insurance-provider"
  ];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.value = "";
  });

  if(appointment){
    document.getElementById("patient").value = appointment.patientId || "";
    document.getElementById("doctor").value = appointment.doctorId || "";
    document.getElementById("appointment-date").value = appointment.date ? appointment.date.split('T')[0] : "";
    document.getElementById("appointment-time").value = appointment.time || "";
    document.getElementById("department").value = appointment.department || "";
    document.getElementById("appointment-type").value = appointment.type || "";
    document.getElementById("reason").value = appointment.reason || "";
    document.getElementById("symptoms").value = appointment.symptoms || "";
    document.getElementById("diagnosis").value = appointment.diagnosis || "";
    document.getElementById("treatment").value = appointment.treatment || "";
    document.getElementById("prescription").value = appointment.prescription || "";
    document.getElementById("consultation-fee").value = appointment.billingAmount || 0;
    document.getElementById("billing-status").value = appointment.billingStatus || "unpaid";
    document.getElementById("payment-method").value = appointment.paymentMethod || "";
    document.getElementById("insurance-provider").value = appointment.insuranceProvider || "";
  }

  const modalTitle = document.querySelector("#appointmentModal .modal-title");
  if(modalTitle) modalTitle.textContent = appointment ? "Edit Appointment" : "Create New Appointment";
  const modal = document.getElementById("appointmentModal");
  if(modal) modal.classList.add("active");
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
