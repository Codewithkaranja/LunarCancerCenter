 // Simple functionality for demonstration
      document.addEventListener("DOMContentLoaded", function () {
        // Get user role from localStorage (set during login)
        const userRole = localStorage.getItem("userRole") || "admin";
        const userName = localStorage.getItem("userName") || "Admin User";

        // Update user info in header
        document.querySelector(".user-details h3").textContent = userName;
        document.querySelector(".user-details p").textContent =
          userRole.charAt(0).toUpperCase() + userRole.slice(1);

        // Adjust UI based on user role
        if (userRole !== "admin") {
          // Hide staff management features for non-admin users
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-delete, .btn-assign")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Show message for non-admin users
          const pageTitle = document.querySelector(".page-title");
          pageTitle.innerHTML += " <small>(View Only)</small>";
        }
      });

      // Logout function
      function logout() {
        // Clear user data from localStorage
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");

        // Redirect to login page
        window.location.href = "index.html";
      }

      // Modal functions
      function openModal() {
        document.getElementById("staffModal").style.display = "flex";
      }

      function closeModal() {
        document.getElementById("staffModal").style.display = "none";
      }

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
let staff = [
  { id: "S1001", firstName: "Dr. Achieng", lastName: "", role: "doctor", department: "Oncology", specialty: "", contact: "achieng@lunarcare.com | +254 712 345 678", status: "active" },
  { id: "S1002", firstName: "Nurse Jane", lastName: "", role: "nurse", department: "Oncology Nursing", specialty: "", contact: "jane@lunarcare.com | +254 723 456 789", status: "active" },
  { id: "S1003", firstName: "Pharmacist John", lastName: "", role: "pharmacist", department: "Pharmacy", specialty: "", contact: "john@lunarcare.com | +254 734 567 890", status: "active" },
  { id: "S1004", firstName: "Cashier Mary", lastName: "", role: "cashier", department: "Finance", specialty: "", contact: "mary@lunarcare.com | +254 745 678 901", status: "active" },
  { id: "S1005", firstName: "Dr. Kamau", lastName: "", role: "doctor", department: "Radiotherapy", specialty: "", contact: "kamau@lunarcare.com | +254 756 789 012", status: "active" }
];

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
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update pagination info
  const info = document.querySelector(".pagination-info");
  info.textContent = `Showing ${start + 1}-${Math.min(start + rowsPerPage, filteredStaff.length)} of ${filteredStaff.length} staff members`;
}

// --------------------------
// Add Staff
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

  if (!firstName || !role || !department) {
    alert("Please fill all required fields.");
    return;
  }

  if (currentEditId) {
    // Edit existing staff
    const staffIndex = staff.findIndex(s => s.id === currentEditId);
    if (staffIndex !== -1) {
      staff[staffIndex] = {
        ...staff[staffIndex],
        firstName,
        lastName,
        role,
        department,
        specialty,
        contact: `${email} | ${phone}`,
        status
      };
    }
    currentEditId = null;
  } else {
    // Add new staff
    const newId = `S${1000 + staff.length + 1}`;
    staff.push({
      id: newId,
      firstName,
      lastName,
      role,
      department,
      specialty,
      contact: `${email} | ${phone}`,
      status
    });
  }

  closeModal();
  resetModal();
  renderTable();
});

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
function assignRole(id) {
  const s = staff.find(st => st.id === id);
  const newRole = prompt("Enter new role for staff:", s.role);
  if (newRole) {
    s.role = newRole.toLowerCase();
    renderTable();
  }
}

// --------------------------
// Export CSV
// --------------------------
function exportCSV() {
  let csv = "ID,Name,Role,Department,Contact,Status\n";
  staff.forEach(s => {
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
// --------------------------
function exportPDF() {
  const tableHtml = document.querySelector(".staff-table").outerHTML;
  const newWin = window.open("");
  newWin.document.write("<html><head><title>Staff PDF</title></head><body>");
  newWin.document.write(tableHtml);
  newWin.document.write("</body></html>");
  newWin.print();
}

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
function openModal() { document.getElementById("staffModal").style.display = "block"; }
function closeModal() { document.getElementById("staffModal").style.display = "none"; currentEditId = null; document.querySelector("#staffModal .modal-title").textContent = "Add New Staff Member"; }
function resetModal() { document.querySelector("#staffModal").querySelectorAll("input, select, textarea").forEach(el => el.value = ""); }

// --------------------------
// Initial render
// --------------------------
renderTable();

// Export buttons
document.querySelector(".btn-success").addEventListener("click", exportCSV);
document.querySelector(".btn-warning").addEventListener("click", exportPDF);
// --------------------------
// Export CSV (filtered & paginated)
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

  // Pagination
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
