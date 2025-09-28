// ==========================
// inventory.js (Backend Integrated & Cleaned)
// ==========================

document.addEventListener("DOMContentLoaded", function () {
  const BASE_URL = "https://lunar-hmis-backend.onrender.com/api";

  const userRole = localStorage.getItem("userRole") || "pharmacist";
  const userName = localStorage.getItem("userName") || "Pharmacist John";

  // Update header
  document.querySelector(".user-details h3").textContent = userName;
  document.querySelector(".user-details p").textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  // Role-based UI
  if (userRole === "doctor") hideActions();
  else if (userRole === "nurse") hideActions(true);
  else if (userRole === "cashier") hideActions();

  fetchInventory();
});

function hideActions(requestOnly = false) {
  document.querySelector(".btn-primary").style.display = "none";
  document.querySelectorAll(".btn-edit, .btn-delete, .btn-restock").forEach(btn => btn.style.display = "none");

  if (requestOnly) {
    document.querySelectorAll(".action-cell").forEach(cell => {
      const requestBtn = document.createElement("button");
      requestBtn.className = "action-btn btn-view";
      requestBtn.innerHTML = '<i class="fas fa-clipboard-list"></i> Request';
      cell.appendChild(requestBtn);
    });
  }

  const pageTitle = document.querySelector(".page-title");
  pageTitle.innerHTML += requestOnly ? " <small>(Request Only)</small>" : " <small>(View Only)</small>";
}

// ==========================
// Inventory Data
// ==========================
let inventory = [];
let currentPage = 1;
const rowsPerPage = 5;
let currentSort = { column: "name", order: "asc" };

// ==========================
// Fetch Inventory from Backend
// ==========================
async function fetchInventory() {
  try {
    const res = await fetch(`${BASE_URL}/inventory`);
    inventory = await res.json();
    renderTable();
  } catch (err) {
    console.error('Error fetching inventory:', err);
  }
}

// ==========================
// Render Table
// ==========================
function renderTable() {
  const tbody = document.querySelector(".inventory-table tbody");
  tbody.innerHTML = "";

  const searchTerm = document.getElementById("search-term").value.toLowerCase();
  const filterCategory = document.getElementById("filter-category").value;
  const filterStatus = document.getElementById("filter-status").value;

  let filtered = inventory.filter(item =>
    (item.name.toLowerCase().includes(searchTerm) || item.id.toLowerCase().includes(searchTerm)) &&
    (filterCategory === "" || item.category === filterCategory) &&
    (filterStatus === "" || item.status === filterStatus)
  );

  // Sorting
  filtered.sort((a, b) => {
    let valA = a[currentSort.column];
    let valB = b[currentSort.column];
    if (currentSort.column === "quantity") { valA = Number(valA); valB = Number(valB); }
    if (currentSort.column === "expiry") { valA = valA ? new Date(valA) : new Date(0); valB = valB ? new Date(valB) : new Date(0); }
    if (valA < valB) return currentSort.order === "asc" ? -1 : 1;
    if (valA > valB) return currentSort.order === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginated = filtered.slice(start, end);

  paginated.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td><span class="category-badge category-${item.category}">${capitalize(item.category)}</span></td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${item.expiry ? formatDate(item.expiry) : "N/A"}</td>
      <td>${item.supplier}</td>
      <td><span class="status-badge status-${item.status}">${capitalizeStatus(item.status)}</span></td>
      <td class="action-cell">
        <button class="action-btn btn-view" onclick="viewItem('${item.id}')"><i class="fas fa-eye"></i> View</button>
        <button class="action-btn btn-edit" onclick="editItem('${item.id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="action-btn btn-restock" onclick="restockItem('${item.id}')"><i class="fas fa-cart-plus"></i> Restock</button>
        <button class="action-btn btn-delete" onclick="disposeItem('${item.id}')"><i class="fas fa-trash"></i> Dispose</button>
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

  document.querySelector(".pagination-info").textContent = `Showing ${Math.min((currentPage-1)*rowsPerPage+1,total)}-${Math.min(currentPage*rowsPerPage,total)} of ${total} inventory items`;
}

// ==========================
// Utilities
// ==========================
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
function capitalizeStatus(status) {
  switch(status){
    case "instock": return "In Stock";
    case "low": return "Low Stock";
    case "out": return "Out of Stock";
    case "expired": return "Expired";
    default: return status;
  }
}

// ==========================
// Search & Filter
// ==========================
document.querySelector(".search-btn").addEventListener("click", () => { currentPage = 1; renderTable(); });
document.querySelector(".table-actions select").addEventListener("change", (e) => {
  const value = e.target.value;
  switch(value){
    case "Sort by: Name A-Z": currentSort = {column:"name",order:"asc"}; break;
    case "Sort by: Name Z-A": currentSort = {column:"name",order:"desc"}; break;
    case "Sort by: Quantity (High to Low)": currentSort = {column:"quantity",order:"desc"}; break;
    case "Sort by: Quantity (Low to High)": currentSort = {column:"quantity",order:"asc"}; break;
    case "Sort by: Expiry Date": currentSort = {column:"expiry",order:"asc"}; break;
  }
  renderTable();
});

// ==========================
// Modal Handling
// ==========================
function openModal() { document.getElementById("inventoryModal").style.display = "block"; }
function closeModal() { document.getElementById("inventoryModal").style.display = "none"; }

// ==========================
// Save / Edit / Restock / Dispose
// ==========================
function generateId() {
  return 'INV-' + Date.now() + '-' + Math.floor(Math.random()*1000);
}

// ==========================
// Save / Add Inventory Item
// ==========================
async function saveItem() {
  const id = document.getElementById("item-id").value;
  const name = document.getElementById("item-name").value.trim();
  const category = document.getElementById("category").value;
  const quantity = Number(document.getElementById("quantity").value);
  const unit = document.getElementById("unit").value;
  const expiry = document.getElementById("expiry-date").value || null;
  const supplier = document.getElementById("supplier-name").value || "Unknown";

  // Validate required fields
  if (!name || !category || unit === "" || quantity < 0 || isNaN(quantity)) {
    alert("Please fill all required fields correctly. Quantity must be 0 or more.");
    return;
  }

  const payload = { name, category, quantity, unit, expiry, supplier };

  try {
    let res, updatedItem;

    if (id) {
      // Update existing item
      res = await fetch(`${BASE_URL}/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Add new item
      res = await fetch(`${BASE_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) {
      const errMsg = await res.json();
      return alert(`Failed to save item: ${errMsg.message}`);
    }

    updatedItem = await res.json();

    if (id) {
      const index = inventory.findIndex(i => i.id === id);
      if (index > -1) inventory[index] = updatedItem;
    } else {
      inventory.push(updatedItem);
    }

    closeModal();
    renderTable();

  } catch (err) {
    console.error(err);
    alert('Failed to save item due to network error');
  }
}

// ==========================
// Helper: Format date for input[type=date]
// ==========================
function formatDateForInput(date) {
  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

// ==========================
// Restock Item using Modal
// ==========================
async function restockItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return alert('Item not found');

  const restockQty = prompt(`Enter quantity to restock for ${item.name}:`);
  const qty = Number(restockQty);

  if (!qty || qty <= 0) return;

  try {
    const res = await fetch(`${BASE_URL}/inventory/restock/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty }) // just send the amount to add
    });

    if (!res.ok) {
      const errMsg = await res.json();
      return alert(`Failed to restock: ${errMsg.message}`);
    }

    const updated = await res.json();
    const index = inventory.findIndex(i => i.id === id);
    if (index > -1) inventory[index] = updated;

    renderTable();
  } catch (err) {
    console.error(err);
    alert('Failed to restock item due to network error');
  }
}




// Dispose / Delete Item
// ==========================
async function disposeItem(id) {
  if (!confirm("Are you sure you want to dispose this item?")) return;

  try {
    const res = await fetch(`${BASE_URL}/inventory/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const errMsg = await res.json();
      alert(`Failed to delete item: ${errMsg.message}`);
      return;
    }

    // Remove from local array and refresh table
    inventory = inventory.filter(i => i.id !== id);
    renderTable();

  } catch (err) {
    console.error(err);
    alert('Failed to delete item due to network error');
  }
}

// ==========================
// View Item in Modal
// ==========================
function viewItem(id) {
  const item = inventory.find(i => i.id === id);

  if (!item) {
    alert('Item not found');
    return;
  }

  // Populate modal fields
  document.getElementById("item-id").value = item.id;
  document.getElementById("item-name").value = item.name;
  document.getElementById("category").value = item.category;
  document.getElementById("quantity").value = item.quantity;
  document.getElementById("unit").value = item.unit;
  document.getElementById("expiry-date").value = item.expiry || "";
  document.getElementById("supplier-name").value = item.supplier || "";

  // Disable inputs for view-only
  ["item-name", "category", "quantity", "unit", "expiry-date", "supplier-name"].forEach(id => {
    document.getElementById(id).disabled = true;
  });

  // Hide Save button
  document.getElementById("save-btn").style.display = "none";

  openModal();
}

// ==========================
// Close Modal (reset view)
// ==========================
function closeModal() {
  document.getElementById("inventoryModal").style.display = "none";

  // Re-enable inputs and show Save button for next use
  ["item-name", "category", "quantity", "unit", "expiry-date", "supplier-name"].forEach(id => {
    document.getElementById(id).disabled = false;
  });
  document.getElementById("save-btn").style.display = "inline-block";
}

// ==========================
// Edit Inventory Item
// ==========================
function editItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;

  document.getElementById("item-id").value = item.id;
  document.getElementById("item-name").value = item.name;
  document.getElementById("category").value = item.category;
  document.getElementById("quantity").value = item.quantity;
  document.getElementById("unit").value = item.unit;
  document.getElementById("expiry-date").value = item.expiry ? formatDateForInput(item.expiry) : "";
  document.getElementById("supplier-name").value = item.supplier || "";
  openModal();
}

// ==========================
// CSV / PDF Export
// ==========================
document.querySelector(".btn-success").addEventListener("click", () => {
  let csv = "data:text/csv;charset=utf-8,Item ID,Item Name,Category,Quantity,Unit,Expiry Date,Supplier,Status\n";
  inventory.forEach(i => { csv += `${i.id},${i.name},${i.category},${i.quantity},${i.unit},${i.expiry||"N/A"},${i.supplier},${i.status}\n`; });
  const link = document.createElement("a");
  link.href = encodeURI(csv);
  link.setAttribute("download","inventory.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

document.querySelector(".btn-warning").addEventListener("click", () => {
  let printContent = "<h2>Inventory Report</h2><table border='1' cellpadding='5'><tr><th>ID</th><th>Name</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Expiry</th><th>Supplier</th><th>Status</th></tr>";
  inventory.forEach(i => { printContent += `<tr><td>${i.id}</td><td>${i.name}</td><td>${capitalize(i.category)}</td><td>${i.quantity}</td><td>${i.unit}</td><td>${i.expiry?formatDate(i.expiry):"N/A"}</td><td>${i.supplier}</td><td>${capitalizeStatus(i.status)}</td></tr>`; });
  printContent += "</table>";
  const win = window.open("");
  win.document.write(printContent);
  win.print();
});
