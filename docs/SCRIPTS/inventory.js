// ==========================
// inventory.js (Clean & Fully Integrated)
// ==========================

// ==========================
// Global Constants & State
// ==========================
const BASE_URL = "https://lunar-hmis-backend.onrender.com/api";

let inventory = [];
let reportData = [];
let currentPage = 1;
const rowsPerPage = 5;
let currentSort = { column: "name", order: "asc" };

// ==========================
// Utilities
// ==========================
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateForInput(date) {
  const d = new Date(date);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

function capitalizeStatus(status) {
  switch (status) {
    case "instock": return "In Stock";
    case "low": return "Low Stock";
    case "out": return "Out of Stock";
    case "expired": return "Expired";
    default: return status;
  }
}

// ==========================
// Role-based UI
// ==========================
function hideActions(requestOnly = false) {
  document.querySelector(".btn-primary")?.style.display = "none";
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
// Fetch / Refresh Inventory
// ==========================
async function refreshInventory() {
  try {
    const res = await fetch(`${BASE_URL}/inventory`);
    if (!res.ok) throw new Error("Failed to fetch inventory");
    const data = await res.json();

    inventory = data.map(item => ({
      ...item,
      status: item.status || calculateStatus(item)
    }));

    reportData = inventory.map(item => ({
      id: item._id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expiry: item.expiry || "N/A",
      supplier: item.supplier || "Unknown",
      status: item.status
    }));

    renderTable();
  } catch (err) {
    console.error("Error refreshing inventory:", err);
  }
}

// Helper to calculate status
function calculateStatus(item) {
  if (item.quantity <= 0) return "out";
  if (item.quantity < (item.reorderLevel || 5)) return "low";
  if (item.expiry && new Date(item.expiry) < new Date()) return "expired";
  return "instock";
}

// ==========================
// Table Rendering
// ==========================
function renderTable() {
  const tbody = document.querySelector(".inventory-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const searchTerm = document.getElementById("search-term")?.value.toLowerCase() || "";
  const filterCategory = document.getElementById("filter-category")?.value || "";
  const filterStatus = document.getElementById("filter-status")?.value || "";

  let filtered = inventory.filter(item =>
    (item.name.toLowerCase().includes(searchTerm) || item._id.toLowerCase().includes(searchTerm)) &&
    (filterCategory === "" || item.category === filterCategory) &&
    (filterStatus === "" || item.status === filterStatus)
  );

  filtered.sort((a, b) => {
    let valA = a[currentSort.column];
    let valB = b[currentSort.column];
    if (currentSort.column === "quantity") { valA = Number(valA); valB = Number(valB); }
    if (currentSort.column === "expiry") { valA = valA ? new Date(valA) : new Date(0); valB = valB ? new Date(valB) : new Date(0); }
    return currentSort.order === "asc" ? (valA < valB ? -1 : valA > valB ? 1 : 0) : (valA > valB ? -1 : valA < valB ? 1 : 0);
  });

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginated = filtered.slice(start, end);

  paginated.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item._id}</td>
      <td>${item.name}</td>
      <td><span class="category-badge category-${item.category}">${capitalize(item.category)}</span></td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${item.expiry ? formatDate(item.expiry) : "N/A"}</td>
      <td>${item.supplier}</td>
      <td><span class="status-badge status-${item.status}">${capitalizeStatus(item.status)}</span></td>
      <td class="action-cell">
        <button class="action-btn btn-view" onclick="viewItem('${item._id}')"><i class="fas fa-eye"></i> View</button>
        <button class="action-btn btn-edit" onclick="editItem('${item._id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="action-btn btn-restock" onclick="restockItem('${item._id}')"><i class="fas fa-cart-plus"></i> Restock</button>
        <button class="action-btn btn-delete" onclick="disposeItem('${item._id}')"><i class="fas fa-trash"></i> Dispose</button>
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

  document.querySelector(".pagination-info").textContent = total
    ? `Showing ${Math.min((currentPage-1)*rowsPerPage+1,total)}-${Math.min(currentPage*rowsPerPage,total)} of ${total} inventory items`
    : `No inventory items to display`;
}

// ==========================
// Modal Handling
// ==========================
function openTab(event, tabId) {
  document.querySelectorAll(".tab-content").forEach(tab => { tab.classList.remove("active"); tab.style.display = "none"; });
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  const selectedTab = document.getElementById(tabId);
  selectedTab.style.display = "block";
  selectedTab.classList.add("active");
  event.currentTarget.classList.add("active");
}

function openModal() {
  const modal = document.getElementById("inventoryModal");
  if (!modal) return;
  modal.style.display = "block";

  document.querySelectorAll(".tab-content").forEach((tab, i) => tab.style.display = i === 0 ? "block" : "none");
  document.querySelectorAll(".tab-btn").forEach((btn, i) => btn.classList.toggle("active", i === 0));
}

function closeModal() {
  const modal = document.getElementById("inventoryModal");
  if (!modal) return;
  modal.style.display = "none";

  ["item-name", "category", "quantity", "unit", "expiry-date", "supplier-name"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });

  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) saveBtn.style.display = "inline-block";
}

// ==========================
// Inventory Actions: View / Edit / Save / Restock / Dispose
// ==========================

// -- View Item
function viewItem(id) {
  const item = inventory.find(i => i._id === id);
  if (!item) return alert('Item not found');

  ["item-id","item-name","category","quantity","unit","expiry-date","supplier-name"].forEach(field => {
    const el = document.getElementById(field);
    if (!el) return;
    el.value = item[field.replace("item-", "")] || item[field.replace("item-", "")]
    el.disabled = true;
  });

  document.getElementById("save-btn").style.display = "none";
  openModal();
}

// -- Edit Item
function editItem(id) {
  const item = inventory.find(i => i._id === id);
  if (!item) return;

  document.getElementById("item-id").value = item._id;
  document.getElementById("item-name").value = item.name;
  document.getElementById("category").value = item.category;
  document.getElementById("quantity").value = item.quantity;
  document.getElementById("unit").value = item.unit;
  document.getElementById("expiry-date").value = item.expiry ? formatDateForInput(item.expiry) : "";
  document.getElementById("supplier-name").value = item.supplier || "";

  openModal();
}

// -- Save / Add Item
async function saveItem() {
  const id = document.getElementById("item-id").value;
  const name = document.getElementById("item-name").value.trim();
  const category = document.getElementById("category").value;
  const quantity = Number(document.getElementById("quantity").value);
  const unit = document.getElementById("unit").value;
  const expiry = document.getElementById("expiry-date").value || null;
  const supplier = document.getElementById("supplier-name").value || "Unknown";

  if (!name || !category || !unit || isNaN(quantity) || quantity < 0) return alert("Fill required fields correctly");

  const payload = { name, category, quantity, unit, expiry, supplier };

  try {
    let method = "POST";
    let url = `${BASE_URL}/inventory`;
    if (id) { method = "PUT"; url = `${BASE_URL}/inventory/${id}`; }

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) return alert("Failed to save item");

    const updatedItem = await res.json();
    if (id) {
      const index = inventory.findIndex(i => i._id === id);
      if (index > -1) inventory[index] = updatedItem;
    } else inventory.push(updatedItem);

    await refreshInventory();
    closeModal();
    alert(`${id ? "Updated" : "Added"} item successfully`);
  } catch (err) {
    console.error(err);
    alert("Network error while saving item");
  }
}

// -- Restock Item
async function restockItem(id) {
  const item = inventory.find(i => i._id === id);
  if (!item) return alert('Item not found');

  const restockQty = Number(prompt(`Enter quantity to restock for ${item.name}:`));
  if (!restockQty || restockQty <= 0) return alert('Enter valid quantity');

  try {
    const res = await fetch(`${BASE_URL}/inventory/restock/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: restockQty })
    });
    if (!res.ok) return alert('Failed to restock item');

    const updatedItem = await res.json();
    const index = inventory.findIndex(i => i._id === id);
    if (index > -1) inventory[index] = updatedItem;

    await refreshInventory();
    alert(`Successfully restocked ${restockQty} units of ${item.name}`);
  } catch (err) {
    console.error(err);
    alert('Network error while restocking');
  }
}

// -- Dispose / Delete Item
async function disposeItem(id) {
  if (!confirm("Are you sure you want to dispose this item?")) return;
  try {
    const res = await fetch(`${BASE_URL}/inventory/${id}`, { method: 'DELETE' });
    if (!res.ok) return alert("Failed to delete item");

    inventory = inventory.filter(i => i._id !== id);
    await refreshInventory();
    alert('Item disposed successfully');
  } catch (err) {
    console.error(err);
    alert('Network error while disposing item');
  }
}

// ==========================
// CSV / Print Export
// ==========================
function syncReportData() {
  reportData = inventory.map(item => ({
    id: item._id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    expiry: item.expiry || "N/A",
    supplier: item.supplier || "Unknown",
    status: item.status
  }));
}

// ==========================
// DOM Ready: Initialize
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const userRole = localStorage.getItem("userRole") || "pharmacist";
  const userName = localStorage.getItem("userName") || "Pharmacist John";

  document.querySelector(".user-details h3").textContent = userName;
  document.querySelector(".user-details p").textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  if (userRole === "doctor") hideActions();
  else if (userRole === "nurse") hideActions(true);
  else if (userRole === "cashier") hideActions();

  refreshInventory();

  document.querySelector(".search-btn")?.addEventListener("click", () => { currentPage = 1; renderTable(); });
  document.querySelector(".table-actions select")?.addEventListener("change", e => {
    switch(e.target.value) {
      case "Sort by: Name A-Z": currentSort = {column:"name",order:"asc"}; break;
      case "Sort by: Name Z-A": currentSort = {column:"name",order:"desc"}; break;
      case "Sort by: Quantity (High to Low)": currentSort = {column:"quantity",order:"desc"}; break;
      case "Sort by: Quantity (Low to High)": currentSort = {column:"quantity",order:"asc"}; break;
      case "Sort by: Expiry Date": currentSort = {column:"expiry",order:"asc"}; break;
    }
    renderTable();
  });

  document.querySelector(".btn-success")?.addEventListener("click", () => {
    syncReportData();
    let csv = "data:text/csv;charset=utf-8,Item ID,Item Name,Category,Quantity,Unit,Expiry Date,Supplier,Status\n";
    reportData.forEach(i => {
      const expiryFormatted = i.expiry === "N/A" ? "N/A" : new Date(i.expiry).toLocaleDateString("en-GB");
      csv += `${i.id},${i.name},${i.category},${i.quantity},${i.unit},${expiryFormatted},${i.supplier},${i.status}\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  document.querySelector(".btn-warning")?.addEventListener("click", () => {
    let printContent = "<h2>Inventory Report</h2><table border='1' cellpadding='5'><tr><th>ID</th><th>Name</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Expiry</th><th>Supplier</th><th>Status</th></tr>";
    inventory.forEach(i => { 
      printContent += `<tr><td>${i._id}</td><td>${i.name}</td><td>${capitalize(i.category)}</td><td>${i.quantity}</td><td>${i.unit}</td><td>${i.expiry ? formatDate(i.expiry) : "N/A"}</td><td>${i.supplier}</td><td>${capitalizeStatus(i.status)}</td></tr>`; 
    });
    printContent += "</table>";
    const win = window.open("");
    win.document.write(printContent);
    win.print();
  });
});
