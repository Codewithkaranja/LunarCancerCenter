// ==========================
// Staff Management JS
// ==========================
const API_BASE = "https://lunar-hmis-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  let staff = [];
  let currentPage = 1;
  const rowsPerPage = 5;
  let currentEditId = null;
  let userRole = null;

  // --------------------------
  // --------------------------
// Auth Check
// --------------------------
(async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });

    if (res.status === 401) {
      // Definitely not logged in
      console.warn("User not authenticated, redirecting...");
      logout();
      return;
    }

    if (!res.ok) {
      // Some other error (server down, CORS, etc.)
      throw new Error(`Auth check failed with status ${res.status}`);
    }

    const { role, name } = await res.json();
    userRole = role;

    const userDetails = document.querySelector(".user-details");
    if (userDetails) {
      userDetails.querySelector("h3").textContent = name;
      userDetails.querySelector("p").textContent =
        role.charAt(0).toUpperCase() + role.slice(1);
    }

    if (role !== "admin") {
      const addBtn = document.querySelector(".btn-primary");
      if (addBtn) addBtn.style.display = "none";

      document.querySelectorAll(".btn-edit, .btn-delete, .btn-assign")
        .forEach((btn) => (btn.style.display = "none"));

      const pageTitle = document.querySelector(".page-title");
      if (pageTitle) pageTitle.innerHTML += " <small>(View Only)</small>";
    }
  } catch (err) {
    console.error("⚠️ Auth check error:", err);
    // Don’t force logout here — just warn the user
    alert("Authentication check failed. Try refreshing.");
  }
})();


  function logout() {
    fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    localStorage.clear();
    window.location.href = "/HTML/index.html";
  }

  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // --------------------------
  // Load Staff
  // --------------------------
  async function loadStaff() {
    try {
      const res = await fetch(`${API_BASE}/staff`);
      if (!res.ok) throw new Error("Failed to fetch staff");
      staff = await res.json();
      renderTable();
    } catch (err) {
      console.error("❌ Error loading staff:", err);
      alert("Could not load staff list.");
    }
  }

  // --------------------------
  // Render Table
  // --------------------------
  function renderTable() {
    const tbody = document.querySelector(".staff-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Apply search/filter
    const searchTerm = document.getElementById("search-name")?.value.toLowerCase() || "";
    const roleFilter = document.getElementById("filter-role")?.value || "";
    const statusFilter = document.getElementById("filter-status")?.value || "";

    const filteredStaff = staff.filter((s) => {
      const matchName =
        s.firstName.toLowerCase().includes(searchTerm) ||
        s._id.toLowerCase().includes(searchTerm);
      const matchRole = roleFilter ? s.role === roleFilter : true;
      const matchStatus = statusFilter ? s.status === statusFilter : true;
      return matchName && matchRole && matchStatus;
    });

    // Pagination
    const start = (currentPage - 1) * rowsPerPage;
    const paginatedStaff = filteredStaff.slice(start, start + rowsPerPage);

    paginatedStaff.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s._id}</td>
        <td>${s.firstName} ${s.lastName || ""}</td>
        <td><span class="role-badge role-${s.role}">${capitalize(s.role)}</span></td>
        <td>${s.department}${s.specialty ? " / " + s.specialty : ""}</td>
        <td>${s.contact || ""}</td>
        <td><span class="status-badge status-${s.status}">${capitalize(s.status)}</span></td>
        <td class="action-cell">
          <button class="action-btn btn-view" data-id="${s._id}"><i class="fas fa-eye"></i> View</button>
          <button class="action-btn btn-edit" data-id="${s._id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="action-btn btn-assign" data-id="${s._id}"><i class="fas fa-user-cog"></i> Role</button>
          <button class="action-btn btn-delete" data-id="${s._id}"><i class="fas fa-trash"></i> Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --------------------------
  // Event delegation for actions
  // --------------------------
  const tbody = document.querySelector(".staff-table tbody");
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const id = btn.getAttribute("data-id");

      if (btn.classList.contains("btn-view")) viewStaff(id);
      else if (btn.classList.contains("btn-edit")) editStaff(id);
      else if (btn.classList.contains("btn-assign")) assignRole(id);
      else if (btn.classList.contains("btn-delete")) deleteStaff(id);
    });
  }

  // --------------------------
  // Save Staff
  // --------------------------
  async function saveStaff(staffData, isEdit = false, id = null) {
    const url = isEdit ? `${API_BASE}/staff/${id}` : `${API_BASE}/staff`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffData),
      });

      if (!res.ok) throw new Error("Failed to save staff");

      closeModal();
      resetModal();
      await loadStaff();
    } catch (err) {
      console.error("❌ Error saving staff:", err);
      alert("Error saving staff. Please try again.");
    }
  }

  async function editStaff(id) {
    const s = staff.find((st) => st._id === id);
    if (!s) return;

    currentEditId = id;

    document.getElementById("first-name").value = s.firstName || "";
    document.getElementById("last-name").value = s.lastName || "";
    document.getElementById("role").value = s.role || "";
    document.getElementById("department").value = s.department || "";
    document.getElementById("specialty").value = s.specialty || "";

    const [email = "", phone = ""] = (s.contact || "").split(" | ");
    document.getElementById("phone").value = phone;
    document.getElementById("email").value = email;

    document.getElementById("status").value = s.status || "active";

    openModal();
  }

  // --------------------------
  // Delete Staff
  // --------------------------
  async function deleteStaff(id) {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      const res = await fetch(`${API_BASE}/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete staff");
      await loadStaff();
    } catch (err) {
      console.error("❌ Error deleting staff:", err);
      alert("Could not delete staff. Try again.");
    }
  }

  // --------------------------
  // Placeholder Functions
  // --------------------------
  function viewStaff(id) {
    alert("View Staff not implemented yet: " + id);
  }

  function assignRole(id) {
    alert("Assign Role not implemented yet: " + id);
  }

  // --------------------------
  // Modal Helpers
  // --------------------------
  function openModal() {
    const modal = document.getElementById("staffModal");
    if (modal) modal.style.display = "flex";
  }
  function closeModal() {
    const modal = document.getElementById("staffModal");
    if (modal) modal.style.display = "none";
    currentEditId = null;
  }
  function resetModal() {
    [
      "first-name",
      "last-name",
      "role",
      "department",
      "specialty",
      "phone",
      "email",
      "status",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = id === "status" ? "active" : "";
    });
    currentEditId = null;
  }

  // --------------------------
  // Event Listeners
  // --------------------------
  const saveBtn = document.querySelector("#staffModal .btn-primary");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
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

      const staffData = {
        firstName,
        lastName,
        role,
        department,
        specialty,
        contact: `${email} | ${phone}`,
        status,
      };

      if (currentEditId) {
        saveStaff(staffData, true, currentEditId);
      } else {
        saveStaff(staffData, false);
      }
    });
  }

  const searchBtn = document.querySelector(".search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      currentPage = 1;
      renderTable();
    });
  }

  document.querySelectorAll(".pagination-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const text = e.target.textContent;

      // Recompute based on filtered staff length
      const searchTerm = document.getElementById("search-name")?.value.toLowerCase() || "";
      const roleFilter = document.getElementById("filter-role")?.value || "";
      const statusFilter = document.getElementById("filter-status")?.value || "";

      const filteredStaff = staff.filter((s) => {
        const matchName =
          s.firstName.toLowerCase().includes(searchTerm) ||
          s._id.toLowerCase().includes(searchTerm);
        const matchRole = roleFilter ? s.role === roleFilter : true;
        const matchStatus = statusFilter ? s.status === statusFilter : true;
        return matchName && matchRole && matchStatus;
      });

      const totalPages = Math.ceil(filteredStaff.length / rowsPerPage);

      if (text.includes("Previous")) currentPage = Math.max(currentPage - 1, 1);
      else if (text.includes("Next")) currentPage = Math.min(currentPage + 1, totalPages);
      else currentPage = Number(text);

      renderTable();
    });
  });

  const csvBtn = document.querySelector(".btn-success");
  if (csvBtn) csvBtn.addEventListener("click", exportCSV);

  const pdfBtn = document.querySelector(".btn-warning");
  if (pdfBtn) pdfBtn.addEventListener("click", exportPDF);

  // --------------------------
  // Helpers
  // --------------------------
  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
  }

  function exportCSV() {
    let csv = "ID,Name,Role,Department,Contact,Status\n";
    staff.forEach((s) => {
      csv += `${s._id},"${s.firstName || ""} ${s.lastName || ""}",${s.role},${s.department},"${s.contact || ""}",${s.status}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "staff.csv";
    link.click();
  }

  function exportPDF() {
    const tableHtml = document.querySelector(".staff-table")?.outerHTML || "";
    const newWin = window.open("");
    newWin.document.write("<html><head><title>Staff PDF</title></head><body>");
    newWin.document.write(tableHtml);
    newWin.document.write("</body></html>");
    newWin.print();
  }

  // --------------------------
  // Initial Load
  // --------------------------
  loadStaff();
});
