// ==========================
// appointments.js (Clean & Fully Fixed)
// ==========================

// Global state
let appointments = [];
let currentPage = 1;
const rowsPerPage = 5;
let currentSort = { column: "date", order: "asc" };
let editingId = null; // Track appointment being edited

// ==========================
// Fetch Appointments
// ==========================
async function fetchAppointments() {
  try {
    const res = await fetch("https://lunar-hmis-backend.onrender.com/api/appointments");
    const data = await res.json();

    appointments = data.map(a => ({
      id: a._id,
      patientId: a.patient?._id || "",
      patient: a.patient?.name || "Unknown",
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
  tbody.innerHTML = "";

  const searchTerm = document.getElementById("search-term").value.toLowerCase();
  const filterDoctor = document.getElementById("filter-doctor").value;
  const filterStatus = document.getElementById("filter-status").value;

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

  document.querySelector(".pagination-info").textContent =
    `Showing ${Math.min((currentPage-1)*rowsPerPage+1,total)}-${Math.min(currentPage*rowsPerPage,total)} of ${total} appointments`;
}

// ==========================
// Utilities
// ==========================
function formatDateTime(date, time) {
  const d = new Date(date + "T" + time);
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) + ", " +
         d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
}

// ==========================
// Search & Sort
// ==========================
document.querySelector(".search-btn").addEventListener("click", () => {
  currentPage = 1;
  renderTable();
});

document.querySelector(".table-actions select").addEventListener("change", (e) => {
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
  document.getElementById("appointmentModal").style.display = "block";
  await populateDropdowns();
}

function closeModal() {
  document.getElementById("appointmentModal").style.display = "none";
  clearModal();
}

function clearModal() {
  document.getElementById("patient").value = "";
  document.getElementById("doctor").value = "";
  document.getElementById("appointment-date").value = "";
  document.getElementById("appointment-time").value = "";
  document.getElementById("department").value = "";
  document.getElementById("appointment-type").value = "";
  document.getElementById("reason").value = "";
  document.getElementById("symptoms").value = "";
  document.getElementById("diagnosis").value = "";
  document.getElementById("treatment").value = "";
  document.getElementById("prescription").value = "";
  document.getElementById("consultation-fee").value = "";
  document.getElementById("billing-status").value = "unpaid";
  document.getElementById("payment-method").value = "";
  document.getElementById("insurance-provider").value = "";
  editingId = null;
}

// ==========================
// Populate Dropdowns
// ==========================
async function populateDropdowns() {
  try {
    // Fetch patients
    const patientRes = await fetch("https://lunar-hmis-backend.onrender.com/api/patients");
    const patientsData = await patientRes.json();
    const patients = patientsData.patients || []; // <-- use the array inside 'patients'

    const patientSelect = document.getElementById("patient");
    patientSelect.innerHTML = '<option value="">Select Patient</option>' +
      patients.map(p => `<option value="${p._id}">${p.firstName} ${p.lastName}</option>`).join("");

    // Fetch doctors
    const doctorRes = await fetch("https://lunar-hmis-backend.onrender.com/api/doctors");
    const doctorsData = await doctorRes.json();
    const doctors = doctorsData.doctors || []; // adjust if your API wraps it like patients

    const doctorSelect = document.getElementById("doctor");
    doctorSelect.innerHTML = '<option value="">Select Doctor/Nurse</option>' +
      doctors.map(d => `<option value="${d._id}">${d.name}</option>`).join("");

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
  if (saveBtn) {
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
        billingAmount: document.getElementById("consultation-fee").value || 0,
        billingStatus: document.getElementById("billing-status").value,
        paymentMethod: document.getElementById("payment-method").value,
        insuranceProvider: document.getElementById("insurance-provider").value
      };

      if (!payload.patient || !payload.doctor || !payload.date || !payload.time || !payload.department) {
        alert("Please fill all required fields");
        return;
      }

      try {
        if (editingId) {
          await fetch(`https://lunar-hmis-backend.onrender.com/api/appointments/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          await fetch("https://lunar-hmis-backend.onrender.com/api/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }

        await fetchAppointments();
        closeModal();
      } catch (err) {
        alert("Error saving appointment: " + err.message);
      }
    });
  }
});

// ==========================
// View / Edit / Cancel
// ==========================
function viewAppointment(id) {
  const app = appointments.find(a => a.id === id);
  alert(`Viewing appointment for ${app.patient} with ${app.doctor} on ${formatDateTime(app.date, app.time)}`);
}

async function editAppointment(id) {
  const app = appointments.find(a => a.id === id);
  await openModal();

  document.getElementById("patient").value = app.patientId;
  document.getElementById("doctor").value = app.doctorId;
  document.getElementById("appointment-date").value = new Date(app.date).toISOString().slice(0,10);
  document.getElementById("appointment-time").value = app.time;
  document.getElementById("department").value = app.department;
  document.getElementById("appointment-type").value = app.type;
  document.getElementById("reason").value = app.reason;

  document.getElementById("symptoms").value = app.symptoms;
  document.getElementById("diagnosis").value = app.diagnosis;
  document.getElementById("treatment").value = app.treatment;
  document.getElementById("prescription").value = app.prescription;

  document.getElementById("consultation-fee").value = app.billingAmount;
  document.getElementById("billing-status").value = app.billingStatus;
  document.getElementById("payment-method").value = app.paymentMethod;
  document.getElementById("insurance-provider").value = app.insuranceProvider;

  editingId = id;
}

async function cancelAppointment(id) {
  if(confirm("Are you sure you want to cancel this appointment?")){
    try {
      await fetch(`https://lunar-hmis-backend.onrender.com/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Canceled" })
      });
      await fetchAppointments();
    } catch (err) {
      alert("Error cancelling appointment: " + err.message);
    }
  }
}

// ==========================
// Export CSV
// ==========================
document.querySelector(".btn-success").addEventListener("click", () => {
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
document.querySelector(".btn-warning").addEventListener("click", () => {
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
  event.currentTarget.classList.add("active");

  document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
}

// Toggle between List View and Calendar View
// ==========================
// View Toggle
// ==========================
function toggleView(view) {
  const listBtn = document.getElementById("listViewBtn");
  const calendarBtn = document.getElementById("calendarViewBtn");
  const listContainer = document.querySelector(".appointments-table-container"); // wrap your table in this div
  const calendarContainer = document.getElementById("calendarContainer"); // create this div in HTML

  if (view === "list") {
    // Show list, hide calendar
    listContainer.style.display = "block";
    calendarContainer.style.display = "none";

    // Style buttons
    listBtn.style.backgroundColor = "#007bff";
    listBtn.style.color = "white";
    calendarBtn.style.backgroundColor = "#f0f0f0";
    calendarBtn.style.color = "#333";
  } else if (view === "calendar") {
    // Show calendar, hide list
    listContainer.style.display = "none";
    calendarContainer.style.display = "block";

    // Style buttons
    calendarBtn.style.backgroundColor = "#007bff";
    calendarBtn.style.color = "white";
    listBtn.style.backgroundColor = "#f0f0f0";
    listBtn.style.color = "#333";

    // Optional: populate calendar view
    if (typeof renderCalendar === "function") {
      renderCalendar();
    }
  }
}

// Example: simple renderCalendar function
function renderCalendar() {
  const calendarContainer = document.getElementById("calendarContainer");
  calendarContainer.innerHTML = "<p>Calendar view coming soon...</p>";
}

function renderCalendar() {
  const calendarEl = document.getElementById("calendar");
  calendarEl.innerHTML = ""; // clear previous

  appointments.forEach(app => {
    const div = document.createElement("div");
    div.textContent = `${app.date} ${app.time} - ${app.patient} with ${app.doctor}`;
    div.classList.add("calendar-event");
    calendarEl.appendChild(div);
  });
}


// Example: CSS for .hidden
// .hidden { display: none; }


// Logout user
function logout() {
  // 1️⃣ Clear any stored tokens or session data
  localStorage.removeItem("token"); // if you use JWT or session tokens
  sessionStorage.clear();

  // 2️⃣ Redirect to login page
  window.location.href = "/HTML/index.html";

  // Optional: show a logout message in console
  console.log("User logged out successfully");
}


// ==========================
// Initial Render
// ==========================
fetchAppointments();
