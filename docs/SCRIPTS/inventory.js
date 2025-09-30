// ==========================
// inventory.js (Backend Integrated & Cleaned)
// ==========================
// Helper: Update inventory for pharmacy/prescription linkage
// Helper: Update inventory for pharmacy/prescription linkage
async function updatePharmacyInventory(itemId, quantityUsed = 0, patientId = null) {
  if (!itemId || quantityUsed <= 0) return; // nothing to update

  try {
    const res = await fetch(`${BASE_URL}/inventory/pharmacy/dispense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: quantityUsed, patientId }),
    });

    if (!res.ok) {
      const errMsg = await res.json();
      console.warn(`❌ Failed to update pharmacy inventory: ${errMsg.message}`);
      return;
    }

    const { item, log } = await res.json(); // backend returns both updated item + log

    // Update local inventory cache
    const index = inventory.findIndex(i => i._id === item._id);
    if (index > -1) {
      inventory[index] = item;
    } else {
      inventory.push(item); // fallback if item wasn’t cached before
    }

    // Re-render table
    renderTable();

    console.log(`✅ Pharmacy inventory updated: ${quantityUsed} units deducted from ${item.name}`);
    if (log) {
      console.log(`📝 Dispense logged for patient ${log.patientId || "N/A"} by user ${log.dispensedBy}`);
    }
  } catch (err) {
    console.error("⚠️ Error updating pharmacy inventory:", err);
  }
}

// ==========================
// Refresh inventory from backend
// ==========================
// ==========================
// Refresh Inventory & Reports
// ==========================
async function refreshInventory() {
  try {
    const res = await fetch(`${BASE_URL}/inventory`);
    if (!res.ok) throw new Error("Failed to fetch inventory");

    const data = await res.json();

    // Ensure status is up-to-date even if backend changes it
    inventory = data.map(item => ({
      ...item,
      status: item.status || calculateStatus(item) // optional frontend fallback
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


// Global Constants & State
// ==========================
const BASE_URL = "https://lunar-hmis-backend.onrender.com/api";

let inventory = [];
let reportData = [];
let currentPage = 1;
const rowsPerPage = 5;
let currentSort = { column: "name", order: "asc" };

// ==========================
// DOM Ready
// ==========================
document.addEventListener("DOMContentLoaded", function () {
  const userRole = localStorage.getItem("userRole") || "pharmacist";
  const userName = localStorage.getItem("userName") || "Pharmacist John";

  // Header info
  document.querySelector(".user-details h3").textContent = userName;
  document.querySelector(".user-details p").textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  // Role-based UI
  if (userRole === "doctor") hideActions();
  else if (userRole === "nurse") hideActions(true);
  else if (userRole === "cashier") hideActions();

  fetchInventory();
});

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
// Fetch Inventory
// ==========================
async function fetchInventory() {
  try {
    const res = await fetch(`${BASE_URL}/inventory`);
    if (!res.ok) throw new Error("Failed to fetch inventory");
    inventory = await res.json();
    reportData = [...inventory];
    renderTable();
  } catch (err) {
    console.error('Error fetching inventory:', err);
  }
}

async function refreshInventory() {
  try {
    const res = await fetch(`${BASE_URL}/inventory`);
    if (!res.ok) throw new Error("Failed to fetch inventory");
    const data = await res.json();
    inventory = data.map(item => ({ ...item, status: item.status || calculateStatus(item) }));
    reportData = [...inventory];
    renderTable();
  } catch (err) {
    console.error('Error refreshing inventory:', err);
  }
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

  // Sorting
  filtered.sort((a, b) => {
    let valA = a[currentSort.column];
    let valB = b[currentSort.column];
    if (currentSort.column === "quantity") { valA = Number(valA); valB = Number(valB); }
    if (currentSort.column === "expiry") { valA = valA ? new Date(valA) : new Date(0); valB = valB ? new Date(valB) : new Date(0); }
    return currentSort.order === "asc" ? (valA < valB ? -1 : valA > valB ? 1 : 0) : (valA > valB ? -1 : valA < valB ? 1 : 0);
  });

  // Pagination
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
// ==========================
// Modal Tab Navigation
// ==========================
function openTab(event, tabId) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.remove("active");
    tab.style.display = "none";
  });

  // Remove active class from all tab buttons
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabId);
  selectedTab.style.display = "block";
  selectedTab.classList.add("active");

  // Activate the clicked button
  event.currentTarget.classList.add("active");
}

// Initialize modal to start on Basic Info
function openModal() {
  document.getElementById("inventoryModal").style.display = "block";
  // Default to first tab
  document.querySelectorAll(".tab-content").forEach((tab, i) => {
    tab.style.display = i === 0 ? "block" : "none";
  });
  document.querySelectorAll(".tab-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === 0);
  });
}
//function openModal() { document.getElementById("inventoryModal").style.display = "block"; }
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
// ==========================
// Save / Add Inventory Item
// ==========================
// ==========================
// Save / Add Inventory Item
// ==========================
async function saveItem() {
  const id = document.getElementById("item-id").value; // backend _id if editing
  const name = document.getElementById("item-name").value.trim();
  const category = document.getElementById("category").value;
  const quantity = Number(document.getElementById("quantity").value);
  const unit = document.getElementById("unit").value;
  const expiry = document.getElementById("expiry-date").value || null;
  const supplier = document.getElementById("supplier-name").value || "Unknown";

  // Supplier & stock info
  const supplierContact = document.getElementById("supplier-contact").value || "";
  const supplierEmail = document.getElementById("supplier-email").value || "";
  const batchNumber = document.getElementById("batch-number").value || "";
  const manufacturer = document.getElementById("manufacturer").value || "";
  const manufactureDate = document.getElementById("manufacture-date").value || null;
  const costPrice = Number(document.getElementById("cost-price").value) || 0;
  const sellingPrice = Number(document.getElementById("selling-price").value) || 0;
  const reorderLevel = Number(document.getElementById("reorder-level").value) || 0;
  const minimumStock = Number(document.getElementById("minimum-stock").value) || 0;
  const taxRate = Number(document.getElementById("tax-rate").value) || 0;
  const insuranceCovered = document.getElementById("insurance-covered").value || "no";

  // ✅ Validation
  if (!name || !category || !unit || quantity < 0 || isNaN(quantity)) {
    return alert("Please fill all required fields correctly. Quantity must be 0 or more.");
  }
  if (sellingPrice < costPrice) {
    return alert("Selling price cannot be lower than cost price.");
  }

  // Build payload (no manual id generation)
  const payload = {
    name, category, quantity, unit, expiry, supplier,
    supplierContact, supplierEmail, batchNumber, manufacturer, manufactureDate,
    costPrice, sellingPrice, reorderLevel, minimumStock, taxRate, insuranceCovered
  };

  try {
    // Decide method and URL
    let method = "POST";
    let url = `${BASE_URL}/inventory`;

    if (id) {
      method = "PUT";
      url = `${BASE_URL}/inventory/${id}`;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errMsg = await res.json();
      return alert(`Failed to save item: ${errMsg.message}`);
    }

    const updatedItem = await res.json();

    // Update local inventory array
    if (id) {
      const index = inventory.findIndex(i => i._id === id);
      if (index > -1) inventory[index] = updatedItem;
    } else {
      inventory.push(updatedItem);
    }

    // ✅ Refresh inventory & reports
    await refreshInventory();

    closeModal();
    alert(`${id ? "Updated" : "Added"} item successfully.`);
  } catch (err) {
    console.error(err);
    alert("Failed to save item due to network error");
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
// ==========================
// Restock Inventory Item
// ==========================
async function restockItem(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return alert('Item not found');

  const restockQty = prompt(`Enter quantity to restock for ${item.name}:`);
  const qty = Number(restockQty);

  if (!qty || qty <= 0) return alert('Please enter a valid quantity greater than 0.');

  try {
    const res = await fetch(`${BASE_URL}/inventory/restock/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty })
    });

    if (!res.ok) {
      const errMsg = await res.json();
      return alert(`Failed to restock: ${errMsg.message}`);
    }

    const updatedItem = await res.json();
    const index = inventory.findIndex(i => i.id === id);
    if (index > -1) inventory[index] = updatedItem;

    // ✅ Removed updatePharmacyInventory here
    // Only call updatePharmacyInventory when dispensing prescriptions

    await refreshInventory();
    alert(`Successfully restocked ${qty} units of ${item.name}.`);
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
      return alert(`Failed to delete item: ${errMsg.message}`);
    }

    inventory = inventory.filter(i => i.id !== id);

    // Refresh inventory & report data
    await refreshInventory();
    alert('Item disposed successfully.');
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
  document.getElementById("item-id").value = item._id;
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
  const modal = document.getElementById("inventoryModal");
  if (!modal) return; // safeguard
  modal.style.display = "none";

  // Re-enable inputs and show Save button for next use
  ["item-name", "category", "quantity", "unit", "expiry-date", "supplier-name"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.disabled = false;
  });
  const saveBtn = document.getElementById("save-btn");
  if(saveBtn) saveBtn.style.display = "inline-block";
}


// ==========================
// Edit Inventory Item
// ==========================
function editItem(id) {
  const item = inventory.find(i => i.id === id);
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

// ==========================
// CSV / PDF Export
// ==========================
//let reportData = []; // mirrors inventory for reports

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

document.querySelector(".btn-success").addEventListener("click", () => {
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


document.querySelector(".btn-warning").addEventListener("click", () => {
  let printContent = "<h2>Inventory Report</h2><table border='1' cellpadding='5'><tr><th>ID</th><th>Name</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Expiry</th><th>Supplier</th><th>Status</th></tr>";
  inventory.forEach(i => { printContent += `<tr><td>${i.id}</td><td>${i.name}</td><td>${capitalize(i.category)}</td><td>${i.quantity}</td><td>${i.unit}</td><td>${i.expiry?formatDate(i.expiry):"N/A"}</td><td>${i.supplier}</td><td>${capitalizeStatus(i.status)}</td></tr>`; });
  printContent += "</table>";
  const win = window.open("");
  win.document.write(printContent);
  win.print();
});
