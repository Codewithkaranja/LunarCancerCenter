 // Simple functionality for demonstration
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // ✅ Ask backend who this user is
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) throw new Error("Not authenticated");

    const { role, name } = await res.json();

    // Save globally
    const userRole = role;
    const userName = name;

    // Update UI
    document.querySelector(".user-details h3").textContent = userName;
    document.querySelector(".user-details p").textContent =
      userRole.charAt(0).toUpperCase() + userRole.slice(1);

    // Role-based UI adjustments
    if (userRole !== "admin") {
      document.querySelector(".btn-primary").style.display = "none";
      document.querySelectorAll(".btn-edit, .btn-delete, .btn-assign")
        .forEach((btn) => (btn.style.display = "none"));

      const pageTitle = document.querySelector(".page-title");
      pageTitle.innerHTML += " <small>(View Only)</small>";
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    logout();
  }
});

// ✅ Logout now calls backend and clears local storage
function logout() {
  fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  localStorage.clear();
  window.location.href = "/index.html";
}

      /* Modal functions
      function openModal() {
        document.getElementById("staffModal").style.display = "flex";
      }

      function closeModal() {
        document.getElementById("staffModal").style.display = "none";
      }*/

      // Tab functions
      function openTab(evt, tabName) {
        // Hide all tab contents
        document.querySelectorAll(".tab-content").forEach((tab) => {
          tab.classList.remove("active");
        });

        // Remove active class from all tabs
        document.querySelectorAll(".tab-btn").forEach((btn) => {
          btn.classList.remove("active");
        });

        // Show the specific tab content
        document.getElementById(tabName).classList.add("active");

        // Add active class to the button that opened the tab
        evt.currentTarget.classList.add("active");
      }

      // Close modal if clicked outside
      window.onclick = function (event) {
        const modal = document.getElementById("staffModal");
        if (event.target === modal) {
          closeModal();
        }
      };

      // ==========================
// Staff Management JS
// ==========================

// Inventory of staff
// ==========================
// Staff Frontend Logic
// ==========================

let staff = [];

// Fetch staff list from backend
async function loadStaff() {
  try {
    const res = await fetch("/api/staff");
    if (!res.ok) throw new Error("Failed to fetch staff");
    staff = await res.json();
    renderTable();
  } catch (err) {
    console.error("❌ Error loading staff:", err);
    alert("Could not load staff list.");
  }
}

// Render staff table
function renderTable() {
  const tbody = document.querySelector(".staff-table tbody");
  tbody.innerHTML = "";

  staff.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s._id}</td>
      <td>${s.firstName} ${s.lastName || ""}</td>
      <td>${s.role}</td>
      <td>${s.department}${s.specialty ? " / " + s.specialty : ""}</td>
      <td>${s.contact}</td>
      <td>${s.status}</td>
      <td>
        <button class="btn-edit" onclick="editStaff('${s._id}')">Edit</button>
        <button class="btn-delete" onclick="deleteStaff('${s._id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Delete staff
async function deleteStaff(id) {
  if (!confirm("Are you sure you want to delete this staff member?")) return;

  try {
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete staff");
    await loadStaff(); // reload table
  } catch (err) {
    console.error("❌ Error deleting staff:", err);
    alert("Could not delete staff. Try again.");
  }
}

// Auto-load on page ready
document.addEventListener("DOMContentLoaded", loadStaff);




let currentPage = 1;
const rowsPerPage = 5;
let currentEditId = null;

// --------------------------
// Render Staff Table
// --------------------------
function renderTable() {
  const tbody = document.querySelector(".staff-table tbody");
  tbody.innerHTML = "";

  // Apply search/filter
  const searchTerm = document.getElementById("search-name").value.toLowerCase();
  const roleFilter = document.getElementById("filter-role").value;
  const statusFilter = document.getElementById("filter-status").value;

  let filteredStaff = staff.filter(s => {
    const matchName = s.firstName.toLowerCase().includes(searchTerm) || s.id.toLowerCase().includes(searchTerm);
    const matchRole = roleFilter ? s.role === roleFilter : true;
    const matchStatus = statusFilter ? s.status === statusFilter : true;
    return matchName && matchRole && matchStatus;
  });

  // Pagination
  const start = (currentPage - 1) * rowsPerPage;
  const paginatedStaff = filteredStaff.slice(start, start + rowsPerPage);

  paginatedStaff.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${s.firstName} ${s.lastName || ""}</td>
      <td><span class="role-badge role-${s.role}">${capitalize(s.role)}</span></td>
      <td>${s.department}${s.specialty ? " / " + s.specialty : ""}</td>
      <td>${s.contact}</td>
      <td><span class="status-badge status-${s.status}">${capitalize(s.status)}</span></td>
      <td class="action-cell">
        <button class="action-btn btn-view" onclick="viewStaff('${s.id}')"><i class="fas fa-eye"></i> View</button>
        <button class="action-btn btn-edit" onclick="editStaff('${s.id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="action-btn btn-assign" onclick="assignRole('${s.id}')"><i class="fas fa-user-cog"></i> Role</button>
        <button class="action-btn btn-delete" onclick="deleteStaff('${s.id}')"><i class="fas fa-trash"></i> Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 🔐 Hide buttons if not admin
  if (userRole !== "admin") {
    document.querySelector(".btn-primary").style.display = "none"; // hide Add Staff
    document.querySelectorAll(".btn-edit, .btn-delete, .btn-assign").forEach(btn => {
      btn.style.display = "none";
    });
  }

  // Update pagination info
  const info = document.querySelector(".pagination-info");
  info.textContent = `Showing ${start + 1}-${Math.min(start + rowsPerPage, filteredStaff.length)} of ${filteredStaff.length} staff members`;
}

// --------------------------
// --------------------------
// Add / Edit Staff (Modal Submit)
// --------------------------
// --------------------------
// Modal Helpers
// --------------------------
/*function openModal() {
  document.getElementById("staffModal").style.display = "block";
}

function closeModal() {
  document.getElementById("staffModal").style.display = "none";
}*/

/*function resetModal() {
  document.getElementById("first-name").value = "";
  document.getElementById("last-name").value = "";
  document.getElementById("role").value = "";
  document.getElementById("department").value = "";
  document.getElementById("specialty").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("email").value = "";
  document.getElementById("status").value = "active";

  currentEditId = null; // reset editing state
}
*/
// --------------------------
// Add / Edit Staff (Modal Submit)
// --------------------------
document.querySelector("#staffModal .btn-primary").addEventListener("click", () => {
  const firstName = document.getElementById("first-name").value.trim();
  const lastName = document.getElementById("last-name").value.trim();
  const role = document.getElementById("role").value;
  const department = document.getElementById("department").value;
  const specialty = document.getElementById("specialty").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const status = document.getElementById("status").value || "active";

  // Validation
  if (!firstName || !role || !department) {
    alert("Please fill all required fields.");
    return;
  }

  const staffData = {
    firstName,
    lastName,
    role,
    department,
    specialty,
    contact: `${email} | ${phone}`,
    status
  };

  if (currentEditId) {
    saveStaff(staffData, true, currentEditId);
  } else {
    saveStaff(staffData, false);
  }
});

// --------------------------
// Save Staff (Create / Edit)
// --------------------------
async function saveStaff(staffData, isEdit = false, id = null) {
  const url = isEdit ? `/api/staff/${id}` : "/api/staff";
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffData)
    });

    if (!res.ok) throw new Error("Failed to save staff");

    closeModal();
    resetModal();
    await loadStaff(); // reload staff list
  } catch (err) {
    console.error("❌ Error saving staff:", err);
    alert("Error saving staff. Please try again.");
  }
}


// --------------------------
// Edit Staff
// --------------------------
function editStaff(id) {
  const s = staff.find(st => st.id === id);
  if (!s) return;
  currentEditId = id;
  openModal();

  // Fill modal fields
  document.getElementById("first-name").value = s.firstName;
  document.getElementById("last-name").value = s.lastName;
  document.getElementById("role").value = s.role;
  document.getElementById("department").value = s.department;
  document.getElementById("specialty").value = s.specialty;
  const [email, phone] = s.contact.split(" | ");
  document.getElementById("email").value = email;
  document.getElementById("phone").value = phone;
  document.getElementById("status").value = s.status;
  document.querySelector("#staffModal .modal-title").textContent = "Edit Staff Member";
}

//Delete Staff
async function deleteStaff(id) {
  if (!confirm("Are you sure you want to delete this staff member?")) return;
  try {
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete staff");
    await loadStaff();
  } catch (err) {
    console.error(err);
    alert("Error deleting staff");
  }
}

// --------------------------
// View Staff (simple alert for now)
// --------------------------
function viewStaff(id) {
  const s = staff.find(st => st.id === id);
  if (s) alert(`${s.firstName} ${s.lastName}\nRole: ${s.role}\nDepartment: ${s.department}\nContact: ${s.contact}\nStatus: ${s.status}`);
}

// --------------------------
// Assign Role (example)
// --------------------------
async function assignRole(id) {
  const newRole = prompt("Enter new role for staff:");
  if (!newRole) return;

  try {
    const res = await fetch(`/api/staff/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole.toLowerCase() })
    });
    if (!res.ok) throw new Error("Failed to update role");
    await loadStaff();
  } catch (err) {
    console.error("Error assigning role:", err);
    alert("Could not update role.");
  }
}


// --------------------------
// Export CSV
// --------------------------
function exportCSV() {
  const searchTerm = document.getElementById("search-name").value.toLowerCase();
  const roleFilter = document.getElementById("filter-role").value;
  const statusFilter = document.getElementById("filter-status").value;

  let filteredStaff = staff.filter(s => {
    const matchName = s.firstName.toLowerCase().includes(searchTerm) || s.id.toLowerCase().includes(searchTerm);
    const matchRole = roleFilter ? s.role === roleFilter : true;
    const matchStatus = statusFilter ? s.status === statusFilter : true;
    return matchName && matchRole && matchStatus;
  });

  const start = (currentPage - 1) * rowsPerPage;
  const paginatedStaff = filteredStaff.slice(start, start + rowsPerPage);

  let csv = "ID,Name,Role,Department,Contact,Status\n";
  paginatedStaff.forEach(s => {
    csv += `${s.id},"${s.firstName} ${s.lastName}",${s.role},${s.department},"${s.contact}",${s.status}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "staff.csv";
  link.click();
}

// --------------------------
// Export PDF
/* --------------------------
function exportPDF() {
  const tableHtml = document.querySelector(".staff-table").outerHTML;
  const newWin = window.open("");
  newWin.document.write("<html><head><title>Staff PDF</title></head><body>");
  newWin.document.write(tableHtml);
  newWin.document.write("</body></html>");
  newWin.print();
}*/

// --------------------------
// Search Button
// --------------------------
document.querySelector(".search-btn").addEventListener("click", () => {
  currentPage = 1;
  renderTable();
});

// --------------------------
// Pagination
// --------------------------
document.querySelectorAll(".pagination-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const text = e.target.textContent;
    const totalPages = Math.ceil(staff.length / rowsPerPage);
    if (text.includes("Previous")) currentPage = Math.max(currentPage - 1, 1);
    else if (text.includes("Next")) currentPage = Math.min(currentPage + 1, totalPages);
    else currentPage = Number(text);
    renderTable();
  });
});

// --------------------------
// Helpers
// --------------------------
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function openModal() { document.getElementById("staffModal").style.display = "flex"; }
function closeModal() { document.getElementById("staffModal").style.display = "none"; currentEditId = null; document.querySelector("#staffModal .modal-title").textContent = "Add New Staff Member"; }
function resetModal() {
  document.getElementById("first-name").value = "";
  document.getElementById("last-name").value = "";
  document.getElementById("role").value = "";
  document.getElementById("department").value = "";
  document.getElementById("specialty").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("email").value = "";
  document.getElementById("status").value = "active";

  currentEditId = null; // reset editing state
}
// --------------------------
// Initial render
// --------------------------
renderTable();

// Export buttons
document.querySelector(".btn-success").addEventListener("click", exportCSV);
document.querySelector(".btn-warning").addEventListener("click", exportPDF);
// --------------------------
// Export CSV (filtered & paginated)
 
function exportCSV() {
  const searchTerm = document.getElementById("search-name").value.toLowerCase();
  const roleFilter = document.getElementById("filter-role").value;
  const statusFilter = document.getElementById("filter-status").value;

  let filteredStaff = staff.filter(s => {
    const matchName = s.firstName.toLowerCase().includes(searchTerm) || s.id.toLowerCase().includes(searchTerm);
    const matchRole = roleFilter ? s.role === roleFilter : true;
    const matchStatus = statusFilter ? s.status === statusFilter : true;
    return matchName && matchRole && matchStatus;
  });

  const start = (currentPage - 1) * rowsPerPage;
  const paginatedStaff = filteredStaff.slice(start, start + rowsPerPage);

  let csv = "ID,Name,Role,Department,Contact,Status\n";
  paginatedStaff.forEach(s => {
    csv += `${s.id},"${s.firstName} ${s.lastName}",${s.role},${s.department},"${s.contact}",${s.status}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "staff.csv";
  link.click();
}

 // --------------------------
 // Export PDF (filtered & paginated)
 // --------------------------
  function exportPDF() {
  const searchTerm = document.getElementById("search-name").value.toLowerCase();
  const roleFilter = document.getElementById("filter-role").value;
  const statusFilter = document.getElementById("filter-status").value;

  let filteredStaff = staff.filter(s => {
    const matchName = s.firstName.toLowerCase().includes(searchTerm) || s.id.toLowerCase().includes(searchTerm);
    const matchRole = roleFilter ? s.role === roleFilter : true;
    const matchStatus = statusFilter ? s.status === statusFilter : true;
    return matchName && matchRole && matchStatus;
  });

  // Pagination
  const start = (currentPage - 1) * rowsPerPage;
  const paginatedStaff = filteredStaff.slice(start, start + rowsPerPage);

  let tableHtml = `
    <table border="1" cellspacing="0" cellpadding="5">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Role</th>
          <th>Department</th>
          <th>Contact</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${paginatedStaff.map(s => `
          <tr>
            <td>${s.id}</td>
            <td>${s.firstName} ${s.lastName}</td>
            <td>${capitalize(s.role)}</td>
            <td>${s.department}${s.specialty ? " / " + s.specialty : ""}</td>
            <td>${s.contact}</td>
            <td>${capitalize(s.status)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const newWin = window.open("");
  newWin.document.write("<html><head><title>Staff PDF</title></head><body>");
  newWin.document.write(tableHtml);
  newWin.document.write("</body></html>");
  newWin.print();
}

      
