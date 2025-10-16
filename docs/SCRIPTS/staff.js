// ==========================
// Staff Management JS
// ==========================
const API_BASE = "https://lunar-hmis-backend.onrender.com/api";

let staff = [];
let currentPage = 1;
const rowsPerPage = 5;
let currentEditId = null;
let userRole = null;

// --------------------------
// Helpers
// --------------------------
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function getRoleBadge(role) {
  const colors = {
    admin: "red",
    doctor: "blue",
    nurse: "green",
    receptionist: "orange",
    lab: "purple",
    accountant: "teal"
  };
  const color = colors[role] || "gray";
  return `<span class="role-badge" style="background-color:${color};color:white;padding:2px 6px;border-radius:4px">${capitalize(role)}</span>`;
}

function getStatusBadge(status) {
  const colors = {
    active: "green",
    inactive: "gray",
    suspended: "red"
  };
  const color = colors[status] || "gray";
  return `<span class="status-badge" style="background-color:${color};color:white;padding:2px 6px;border-radius:4px">${capitalize(status)}</span>`;
}

// --------------------------
// Global functions for HTML
// --------------------------
// Open specific tab in Add/Edit Staff Modal
function openTab(tabId) {
  const modal = document.getElementById("staffModal");
  const tabs = modal.querySelectorAll(".tab-content");
  const buttons = modal.querySelectorAll(".tab-btn");

  tabs.forEach(t => t.classList.remove("active"));
  buttons.forEach(b => b.classList.remove("active"));

  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add("active");

  const targetBtn = modal.querySelector(`.tab-btn[data-target="${tabId}"]`);
  if (targetBtn) targetBtn.classList.add("active");
}

// Modal open/close logic
function showModal() {
  const modal = document.getElementById("staffModal");
  modal.style.display = "flex";
  openTab("personal-info"); // default tab
}

function closeModal() {
  const modal = document.getElementById("staffModal");
  modal.style.display = "none";
}

// Attach events after DOM loaded
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("staffModal");

  // Tab buttons
  modal.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      openTab(btn.dataset.target);
    });
  });

  // Close buttons
  modal.querySelectorAll(".modal-close, .modal-cancel").forEach(btn => {
    btn.addEventListener("click", closeModal);
  });

  // Close if clicking outside content
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
});

window.closeModal = function() {
  const modal = document.getElementById("staffModal");
  if (modal) modal.style.display = "none";
  currentEditId = null;
};

window.viewStaff = function(id) {
  const s = staff.find(st => st._id === id);
  if (!s) return alert("Staff not found.");

  const modal = document.getElementById("staffViewModal");
  if (!modal) return;

  modal.querySelector(".view-name").textContent = `${s.firstName} ${s.lastName || ""}`;
  modal.querySelector(".view-role").textContent = capitalize(s.role);
  modal.querySelector(".view-department").textContent = `${s.department}${s.specialty ? " / " + s.specialty : ""}`;
  modal.querySelector(".view-contact").textContent = s.contact || "";
  modal.querySelector(".view-status").textContent = capitalize(s.status);
  modal.querySelector(".view-appointments").textContent = s.appointments?.length || 0;
  modal.querySelector(".view-prescriptions").textContent = s.prescriptions?.length || 0;
  modal.querySelector(".view-lab-reports").textContent = s.labReports?.length || 0;
  modal.querySelector(".view-dispenses").textContent = s.dispenses?.length || 0;
  modal.querySelector(".view-inventory").textContent = s.inventoryChanges?.length || 0;
  modal.querySelector(".view-patients").textContent = s.patients?.length || 0;
  modal.querySelector(".view-reports").textContent = s.reports?.length || 0;
  modal.querySelector(".view-invoice").textContent = s.invoice?.length || 0;

  modal.style.display = "flex";

  modal.querySelector(".modal-close")?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
};

window.editStaff = function(id) {
  const s = staff.find(st => st._id === id);
  if (!s) return alert("Staff not found.");

  currentEditId = id;

  // Map HTML IDs to object keys
  const fieldMap = {
    "first-name": "firstName",
    "last-name": "lastName",
    "role": "role",
    "department": "department",
    "specialty": "specialty",
    "email": "contact",   // split later
    "phone": "contact",   // split later
    "status": "status"
  };

  Object.keys(fieldMap).forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (id === "email") el.value = (s.contact || "").split(" | ")[0] || "";
    else if (id === "phone") el.value = (s.contact || "").split(" | ")[1] || "";
    else el.value = s[fieldMap[id]] || "";
  });

  // Open modal
  const modal = document.getElementById("staffModal");
  if (modal) {
    modal.style.display = "flex";

    // Reset all tabs
    const tabButtons = modal.querySelectorAll(".tab-btn");
    const tabContents = modal.querySelectorAll(".tab-content");
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(tc => tc.classList.remove("active"));

    // Show default tab (personal-info)
    const defaultTab = modal.querySelector(".tab-btn[data-target='personal-info']");
    const defaultContent = modal.querySelector("#personal-info");
    if (defaultTab && defaultContent) {
      defaultTab.classList.add("active");
      defaultContent.classList.add("active");
    }
  }
};


window.assignRole = function(id) {
  alert("Assign Role feature not implemented yet: " + id);
};

window.deleteStaff = function(id) {
  if (!confirm("Are you sure you want to delete this staff member?")) return;

  fetch(`${API_BASE}/staff/${id}`, { 
    method: "DELETE", 
    credentials: "include" 
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to delete staff");
      loadStaff(); // ✅ Refresh the list after deletion
    })
    .catch(err => {
      console.error(err);
      alert("Could not delete staff. Try again.");
    });
};

// --------------------------
// Load & Render Staff
// --------------------------
async function loadStaff() {
  try {
    const url = `${API_BASE}/staff?populate=appointments,prescriptions,labReports,dispenses,inventoryChanges,patients,reports,invoice`;
    console.log("Fetching staff from:", url);

    const res = await fetch(url); // removed credentials

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status} ${res.statusText}`;
      try {
        const errData = await res.json();
        if (errData?.message) errorMessage += ` - ${errData.message}`;
      } catch (parseErr) {
        console.warn("Could not parse error response:", parseErr);
      }
      throw new Error(errorMessage);
    }

    staff = await res.json();
    console.log("✅ Staff fetched successfully:", staff);

    renderTable(); // render immediately
  } catch (err) {
    console.error("❌ Error loading staff:", err);
    alert(`Could not load staff list. ${err.message}`);
  }
}


function renderTable() {
  const tbody = document.querySelector(".staff-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const searchTerm = document.getElementById("search-name")?.value.toLowerCase() || "";
  const roleFilter = document.getElementById("filter-role")?.value || "";
  const statusFilter = document.getElementById("filter-status")?.value || "";

  const filteredStaff = staff.filter(s => {
    const matchName = (s.firstName || "").toLowerCase().includes(searchTerm) ||
                      (s.lastName || "").toLowerCase().includes(searchTerm) ||
                      (s._id || "").toLowerCase().includes(searchTerm);
    const matchRole = roleFilter ? s.role === roleFilter : true;
    const matchStatus = statusFilter ? s.status === statusFilter : true;
    return matchName && matchRole && matchStatus;
  });

  const start = (currentPage - 1) * rowsPerPage;
  const paginatedStaff = filteredStaff.slice(start, start + rowsPerPage);

  paginatedStaff.forEach(s => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${s._id || ""}</td>
      <td>${s.firstName || ""} ${s.lastName || ""}</td>
      <td>${getRoleBadge(s.role)}</td>
      <td>${s.department || ""}${s.specialty ? " / " + s.specialty : ""}</td>
      <td>${s.contact || ""}</td>
      <td>${getStatusBadge(s.status)}</td>
      <td class="action-cell">
        <button class="action-btn btn-view"><i class="fas fa-eye"></i> View</button>
        <button class="action-btn btn-edit"><i class="fas fa-edit"></i> Edit</button>
        <button class="action-btn btn-assign"><i class="fas fa-user-cog"></i> Role</button>
        <button class="action-btn btn-delete"><i class="fas fa-trash"></i> Delete</button>
      </td>
    `;

    tbody.appendChild(tr);

    // Safe event binding
    const btnView = tr.querySelector(".btn-view");
    btnView?.addEventListener("click", () => viewStaff(s._id));

    if (userRole === "admin") {
      tr.querySelector(".btn-edit")?.addEventListener("click", () => editStaff(s._id));
      tr.querySelector(".btn-assign")?.addEventListener("click", () => assignRole(s._id));
      tr.querySelector(".btn-delete")?.addEventListener("click", () => deleteStaff(s._id));
    } else {
      tr.querySelector(".btn-edit")?.style.setProperty("display", "none");
      tr.querySelector(".btn-assign")?.style.setProperty("display", "none");
      tr.querySelector(".btn-delete")?.style.setProperty("display", "none");
    }
  });

  // Pagination info
  const info = document.querySelector(".pagination-info");
  if (info) {
    const showingStart = filteredStaff.length ? start + 1 : 0;
    const showingEnd = start + paginatedStaff.length;
    info.textContent = `Showing ${showingStart}-${showingEnd} of ${filteredStaff.length} staff members`;
  }
}

// --------------------------
// Pagination & Search
// --------------------------
function searchStaff(){currentPage=1;renderTable();}
function goToPage(page){
  const searchTerm = document.getElementById("search-name")?.value.toLowerCase()||"";
  const roleFilter = document.getElementById("filter-role")?.value||"";
  const statusFilter = document.getElementById("filter-status")?.value||"";
  const filteredStaff = staff.filter(s=>{
    const matchName = s.firstName.toLowerCase().includes(searchTerm)||(s.lastName||"").toLowerCase().includes(searchTerm)||s._id.toLowerCase().includes(searchTerm);
    const matchRole = roleFilter?s.role===roleFilter:true;
    const matchStatus = statusFilter?s.status===statusFilter:true;
    return matchName && matchRole && matchStatus;
  });
  const totalPages = Math.ceil(filteredStaff.length/rowsPerPage);
  if(page==="prev") currentPage=Math.max(currentPage-1,1);
  else if(page==="next") currentPage=Math.min(currentPage+1,totalPages);
  else currentPage=Number(page);
  renderTable();
}

// --------------------------
// Modal helpers
// --------------------------
function resetModal() {
  const fields = ["first-name","last-name","role","department","specialty","phone","email","status"];
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = "";
  });

  // Reset tabs to show the first tab
  const modal = document.getElementById("staffModal");
  if (modal) {
    const tabButtons = modal.querySelectorAll(".tab-btn");
    const tabContents = modal.querySelectorAll(".tab-content");
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(tc => tc.classList.remove("active"));
    if (tabButtons[0] && tabContents[0]) {
      tabButtons[0].classList.add("active");
      tabContents[0].classList.add("active");
    }
  }

  currentEditId = null;
}


// --------------------------
// Save Staff
// --------------------------
async function saveStaffData(e) {
  e.preventDefault();

  const staffData = {
    firstName: document.getElementById("first-name").value.trim(),
    lastName: document.getElementById("last-name").value.trim(),
    role: document.getElementById("role").value,
    department: document.getElementById("department").value,
    specialty: document.getElementById("specialty").value,
    phone: document.getElementById("phone").value,
    email: document.getElementById("email").value,
    status: document.getElementById("status").value
  };

  try {
    const res = await fetch(`${API_BASE}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffData)
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("❌ Server error:", errData);
      alert(`Error: ${errData.message || "Failed to save staff"}`);
      return;
    }

    const newStaff = await res.json();
    console.log("✅ Staff saved:", newStaff);
    alert("✅ Staff added successfully!");

    // Refresh the table automatically
    loadStaff();
    resetModal();
  } catch (err) {
    console.error("❌ Error saving staff:", err);
    alert("⚠️ Network or CORS error — please check backend URL and CORS config.");
  }
}


// --------------------------
// Export
// --------------------------
function exportCSV(){
  let csv="ID,Name,Role,Department,Contact,Status\n";
  staff.forEach(s=>{csv+=`${s._id},"${s.firstName||""} ${s.lastName||""}",${s.role},${s.department},"${s.contact||""}",${s.status}\n`});
  const blob=new Blob([csv],{type:"text/csv"});
  const link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="staff.csv";
  link.click();
}

function exportPDF(){
  const tableHtml=document.querySelector(".staff-table")?.outerHTML||"";
  const newWin=window.open("");
  newWin.document.write(`<html><head><title>Staff PDF</title></head><body>${tableHtml}</body></html>`);
  newWin.print();
}

// --------------------------
// Init DOM
// --------------------------
document.addEventListener("DOMContentLoaded",()=>{
  const staffModal=document.getElementById("staffModal");
  document.querySelector(".page-actions .btn.btn-primary")?.addEventListener("click",()=>{
    resetModal();staffModal.style.display="flex";
  });
  staffModal?.querySelector(".modal-close")?.addEventListener("click",()=>{staffModal.style.display="none";currentEditId=null;});
  staffModal?.addEventListener("click",e=>{if(e.target===staffModal){staffModal.style.display="none";currentEditId=null;}});
  staffModal?.querySelector(".form-actions .btn.btn-primary")?.addEventListener("click",saveStaffData);

  document.querySelector(".search-btn")?.addEventListener("click",searchStaff);
  document.getElementById("filter-role")?.addEventListener("change",searchStaff);
  document.getElementById("filter-status")?.addEventListener("change",searchStaff);
  document.querySelector(".table-actions select")?.addEventListener("change",searchStaff);
  document.querySelector(".btn-success")?.addEventListener("click",exportCSV);
  document.querySelector(".btn-warning")?.addEventListener("click",exportPDF);

  loadStaff();
});
