// ==========================
// appointments.js (Updated for populated Patient + Staff)
// ==========================

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

    // ✅ Map MongoDB populated fields
    appointments = data.map(a => ({
      id: a._id,
      patientId: a.patient?._id || "",        // dropdown reference
      patient: a.patient?.name || "Unknown",  // display name
      doctorId: a.doctor?._id || "",
      doctor: a.doctor?.name || "Unassigned",
      date: a.date,
      time: a.time,
      department: a.department || a.doctor?.department || "",
      status: a.status,
      billing: a.billing || "Unpaid"
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
      <td><span class="billing-status billing-${a.billing.toLowerCase()}">${a.billing}</span></td>
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
// Search & Filter
// ==========================
document.querySelector(".search-btn").addEventListener("click", () => {
  currentPage = 1;
  renderTable();
});


// ==========================
// Sorting
// ==========================
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
function openModal() {
  document.getElementById("appointmentModal").style.display = "block";
}
function closeModal() {
  document.getElementById("appointmentModal").style.display = "none";
  clearModal();
}
function clearModal(){
  document.getElementById("patient").value = "";
  document.getElementById("doctor").value = "";
  document.getElementById("appointment-date").value = "";
  document.getElementById("appointment-time").value = "";
  document.getElementById("department").value = "";
  editingId = null;
}


// ==========================
// Create / Edit Appointment
// ==========================
document.querySelector("#appointmentModal .btn-primary").addEventListener("click", async () => {
  const patientId = document.getElementById("patient").value;
  const doctorId = document.getElementById("doctor").value;
  const date = document.getElementById("appointment-date").value;
  const time = document.getElementById("appointment-time").value;
  const department = document.getElementById("department").value;
  const status = "Scheduled";
  const billing = "Unpaid";

  if (!patientId || !doctorId || !date || !time || !department) {
    alert("Please fill all required fields");
    return;
  }

  try {
    if (editingId) {
      // ✅ Update existing appointment
      await fetch(`https://lunar-hmis-backend.onrender.com/api/appointments/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient: patientId, doctor: doctorId, date, time, department })
      });
    } else {
      // ✅ Create new appointment
      await fetch("https://lunar-hmis-backend.onrender.com/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient: patientId, doctor: doctorId, date, time, department, status, billing })
      });
    }

    await fetchAppointments();
    closeModal();
  } catch (err) {
    alert("Error saving appointment: " + err.message);
  }
});


// ==========================
// View / Edit / Cancel
// ==========================
function viewAppointment(id){
  const app = appointments.find(a => a.id === id);
  alert(`Viewing appointment for ${app.patient} with ${app.doctor} on ${formatDateTime(app.date, app.time)}`);
}

function editAppointment(id){
  const app = appointments.find(a => a.id === id);
  document.getElementById("patient").value = app.patientId;
  document.getElementById("doctor").value = app.doctorId;
  document.getElementById("appointment-date").value = app.date.split("T")[0];
  document.getElementById("appointment-time").value = app.time;
  document.getElementById("department").value = app.department;
  editingId = id;
  openModal();
}

async function cancelAppointment(id){
  if(confirm("Are you sure you want to cancel this appointment?")){
    try {
      await fetch(`https://lunar-hmis-backend.onrender.com/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled" })
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
    csvContent += `${a.id},${a.patient},${a.doctor},${a.date},${a.time},${a.department},${a.status},${a.billing}\n`;
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
// Initial Render
// ==========================
fetchAppointments();
