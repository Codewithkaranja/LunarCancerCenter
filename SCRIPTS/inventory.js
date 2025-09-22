// Simple functionality for demonstration
      document.addEventListener("DOMContentLoaded", function () {
        // Get user role from localStorage (set during login)
        const userRole = localStorage.getItem("userRole") || "pharmacist";
        const userName = localStorage.getItem("userName") || "Pharmacist John";

        // Update user info in header
        document.querySelector(".user-details h3").textContent = userName;
        document.querySelector(".user-details p").textContent =
          userRole.charAt(0).toUpperCase() + userRole.slice(1);

        // Adjust UI based on user role
        if (userRole === "doctor") {
          // Doctors can only view inventory
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-delete, .btn-restock")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Show message for view-only users
          const pageTitle = document.querySelector(".page-title");
          pageTitle.innerHTML += " <small>(View Only)</small>";
        } else if (userRole === "nurse") {
          // Nurses can request items but not edit inventory
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-delete, .btn-restock")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Add request button for nurses
          const actionCells = document.querySelectorAll(".action-cell");
          actionCells.forEach((cell) => {
            const requestBtn = document.createElement("button");
            requestBtn.className = "action-btn btn-view";
            requestBtn.innerHTML =
              '<i class="fas fa-clipboard-list"></i> Request';
            cell.appendChild(requestBtn);
          });

          // Show message for nurses
          const pageTitle = document.querySelector(".page-title");
          pageTitle.innerHTML += " <small>(Request Only)</small>";
        } else if (userRole === "cashier") {
          // Cashiers can only view inventory
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-delete, .btn-restock")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Show message for view-only users
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
        document.getElementById("inventoryModal").style.display = "flex";
      }

      function closeModal() {
        document.getElementById("inventoryModal").style.display = "none";
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
        const modal = document.getElementById("inventoryModal");
        if (event.target === modal) {
          closeModal();
        }
      };
      // ==========================
// inventory.js
// ==========================

let inventory = [
  {
    id: "I1001",
    name: "Paclitaxel Injection",
    category: "drug",
    quantity: 45,
    unit: "vials",
    expiry: "2024-03-15",
    supplier: "MedSupplies Ltd",
    status: "instock",
    description: "Used in chemotherapy",
    costPrice: 0,
    sellingPrice: 0,
    reorderLevel: 10,
    minimumStock: 5,
    taxRate: 16,
    insurance: "yes",
  },
  {
    id: "I1002",
    name: "Chemo Gloves",
    category: "consumable",
    quantity: 8,
    unit: "pairs",
    expiry: null,
    supplier: "SafeGear Inc",
    status: "low",
  },
  {
    id: "I1003",
    name: "Cyclophosphamide Tablets",
    category: "drug",
    quantity: 0,
    unit: "tablets",
    expiry: "2024-06-30",
    supplier: "PharmaKenya",
    status: "out",
  },
  {
    id: "I1004",
    name: "Infusion Pump",
    category: "equipment",
    quantity: 3,
    unit: "units",
    expiry: null,
    supplier: "MediTech Solutions",
    status: "instock",
  },
  {
    id: "I1005",
    name: "5-FU Cream",
    category: "drug",
    quantity: 12,
    unit: "tubes",
    expiry: "2025-12-15",
    supplier: "DermaCare Ltd",
    status: "expired",
  },
];

let currentPage = 1;
const rowsPerPage = 5;
let currentSort = { column: "name", order: "asc" };

// ==========================
// Render Inventory Table
// ==========================
function renderTable() {
  const tbody = document.querySelector(".inventory-table tbody");
  tbody.innerHTML = "";

  const searchTerm = document.getElementById("search-term").value.toLowerCase();
  const filterCategory = document.getElementById("filter-category").value;
  const filterStatus = document.getElementById("filter-status").value;

  let filtered = inventory.filter((item) => {
    return (
      (item.name.toLowerCase().includes(searchTerm) || item.id.toLowerCase().includes(searchTerm)) &&
      (filterCategory === "" || item.category === filterCategory) &&
      (filterStatus === "" || item.status === filterStatus)
    );
  });

  // Sorting
  filtered.sort((a, b) => {
    let valA = a[currentSort.column];
    let valB = b[currentSort.column];
    if (currentSort.column === "quantity") {
      valA = Number(valA);
      valB = Number(valB);
    }
    if (currentSort.column === "expiry") {
      valA = valA ? new Date(valA) : new Date(0);
      valB = valB ? new Date(valB) : new Date(0);
    }
    if (valA < valB) return currentSort.order === "asc" ? -1 : 1;
    if (valA > valB) return currentSort.order === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginated = filtered.slice(start, end);

  paginated.forEach((item) => {
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
  prevBtn.onclick = () => {
    currentPage--;
    renderTable();
  };
  paginationControls.appendChild(prevBtn);

  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement("button");
    btn.className = "pagination-btn" + (i === currentPage ? " active" : "");
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderTable();
    };
    paginationControls.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "pagination-btn";
  nextBtn.textContent = "Next »";
  nextBtn.disabled = currentPage === pageCount;
  nextBtn.onclick = () => {
    currentPage++;
    renderTable();
  };
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
// Add
// ==========================
// Add New Inventory Item
// ==========================
document.querySelector("#inventoryModal .btn-primary").addEventListener("click", () => {
  // Get values from modal
  const id = document.getElementById("item-id").value || `I${1000 + inventory.length + 1}`;
  const name = document.getElementById("item-name").value.trim();
  const category = document.getElementById("category").value;
  const quantity = Number(document.getElementById("quantity").value);
  const unit = document.getElementById("unit").value;
  const expiry = document.getElementById("expiry-date").value || null;
  const supplier = document.getElementById("supplier-name").value || "Unknown";

  // Basic validation
  if (!name || !category || !quantity || !unit) {
    alert("Please fill all required fields");
    return;
  }

  // Check if ID already exists
  const exists = inventory.find(i => i.id === id);
  if (exists) {
    alert("Item ID already exists. Use a unique ID or leave blank for auto-generated.");
    return;
  }

  // Add new item to inventory
  inventory.push({
    id,
    name,
    category,
    quantity,
    unit,
    expiry,
    supplier,
    status: quantity === 0 ? "out" : (quantity < 10 ? "low" : "instock")
  });

  // Close modal and refresh table
  closeModal();
  renderTable();

  // Reset modal fields for next add
  document.getElementById("inventoryModal").querySelectorAll("input, select, textarea").forEach(el => el.value = "");
});

// Edit Item
// ==========================
document.querySelector("#inventoryModal .btn-primary").addEventListener("click", () => {
  const id = document.getElementById("item-id").value || `I${1000 + inventory.length + 1}`;
  const name = document.getElementById("item-name").value;
  const category = document.getElementById("category").value;
  const quantity = Number(document.getElementById("quantity").value);
  const unit = document.getElementById("unit").value;
  const expiry = document.getElementById("expiry-date").value || null;
  const supplier = document.getElementById("supplier-name").value || "Unknown";
  
  if(!name || !category || !quantity || !unit) { alert("Please fill all required fields"); return; }

  // Check if editing
  const existingIndex = inventory.findIndex(i => i.id === id);
  if(existingIndex > -1){
    inventory[existingIndex] = { ...inventory[existingIndex], id, name, category, quantity, unit, expiry, supplier };
  } else {
    inventory.push({ id, name, category, quantity, unit, expiry, supplier, status: quantity===0?"out":(quantity<10?"low":"instock") });
  }

  closeModal();
  renderTable();
});

// ==========================
// View / Edit / Restock / Dispose
// ==========================
function viewItem(id){
  const item = inventory.find(i=>i.id===id);
  alert(`${item.name}\nCategory: ${capitalize(item.category)}\nQuantity: ${item.quantity}\nUnit: ${item.unit}\nExpiry: ${item.expiry?formatDate(item.expiry):"N/A"}\nSupplier: ${item.supplier}\nStatus: ${capitalizeStatus(item.status)}`);
}

function editItem(id){
  const item = inventory.find(i=>i.id===id);
  document.getElementById("item-id").value = item.id;
  document.getElementById("item-name").value = item.name;
  document.getElementById("category").value = item.category;
  document.getElementById("quantity").value = item.quantity;
  document.getElementById("unit").value = item.unit;
  document.getElementById("expiry-date").value = item.expiry || "";
  document.getElementById("supplier-name").value = item.supplier || "";
  openModal();
}

function restockItem(id){
  const item = inventory.find(i=>i.id===id);
  const qty = Number(prompt(`Enter quantity to restock for ${item.name}:`));
  if(!isNaN(qty) && qty>0){ 
    item.quantity += qty;
    item.status = item.quantity===0?"out":(item.quantity<10?"low":"instock");
    renderTable();
  }
}

function disposeItem(id){
  if(confirm("Are you sure you want to dispose this item?")){
    inventory = inventory.filter(i=>i.id!==id);
    renderTable();
  }
}

// ==========================
// Export CSV
// ==========================
document.querySelector(".btn-success").addEventListener("click", () => {
  let csv = "data:text/csv;charset=utf-8,Item ID,Item Name,Category,Quantity,Unit,Expiry Date,Supplier,Status\n";
  inventory.forEach(i=>{
    csv += `${i.id},${i.name},${i.category},${i.quantity},${i.unit},${i.expiry||"N/A"},${i.supplier},${i.status}\n`;
  });
  const encodedUri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "inventory.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ==========================
// Export PDF (simple print-based)
// ==========================
document.querySelector(".btn-warning").addEventListener("click", () => {
  let printContent = "<h2>Inventory Report</h2><table border='1' cellpadding='5'><tr><th>ID</th><th>Name</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Expiry</th><th>Supplier</th><th>Status</th></tr>";
  inventory.forEach(i=>{
    printContent += `<tr><td>${i.id}</td><td>${i.name}</td><td>${capitalize(i.category)}</td><td>${i.quantity}</td><td>${i.unit}</td><td>${i.expiry?formatDate(i.expiry):"N/A"}</td><td>${i.supplier}</td><td>${capitalizeStatus(i.status)}</td></tr>`;
  });
  printContent += "</table>";
  const win = window.open("");
  win.document.write(printContent);
  win.print();
});

// ==========================
// Initial Render
// ==========================
renderTable();
