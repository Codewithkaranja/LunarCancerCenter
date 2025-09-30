// ============================
// pharmacy.js
// ============================
const API_BASE = "https://lunar-hmis-backend.onrender.com/api";

// Global state
let medicines = [];
let prescriptions = [];
let editingMedicineId = null;

// ============================
// Fetch Inventory (Medicines)
// ============================
async function fetchMedicines() {
  try {
    const res = await fetch(`${API_BASE}/inventory`);
    if (!res.ok) throw new Error("Failed to fetch medicines");
    medicines = await res.json();
    renderMedicines();
  } catch (err) {
    console.error(err);
    alert("Error fetching medicines");
  }
}

function renderMedicines() {
  const tbody = document.getElementById("medicine-table-body");
  tbody.innerHTML = "";

  medicines.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.name}</td>
      <td>${m.batchNumber}</td>
      <td>${formatDate(m.expiryDate)}</td>
      <td>${m.quantity}</td>
      <td>${m.unitPrice}</td>
      <td>${getStockStatus(m)}</td>
      <td>
        <button class="btn btn-sm btn-edit" onclick="editMedicine('${m._id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteMedicine('${m._id}')">Delete</button>
        <button class="btn btn-sm btn-warning" onclick="openRestockModal('${m._id}')">Restock</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getStockStatus(m) {
  if (m.quantity <= 5) return `<span class="status-badge low">Low</span>`;
  if (new Date(m.expiryDate) < new Date()) return `<span class="status-badge expired">Expired</span>`;
  return `<span class="status-badge adequate">Adequate</span>`;
}

// ============================
// Add / Edit Medicine
// ============================
document.getElementById("add-medicine-btn").addEventListener("click", openAddModal);
document.getElementById("add-medicine-btn-2").addEventListener("click", openAddModal);

function openAddModal() {
  editingMedicineId = null;
  document.getElementById("modal-title").innerText = "Add Medicine";
  document.getElementById("medicine-form").reset();
  document.getElementById("medicine-modal").style.display = "block";
}

function editMedicine(id) {
  const med = medicines.find((m) => m._id === id);
  if (!med) return;

  editingMedicineId = id;
  document.getElementById("modal-title").innerText = "Edit Medicine";
  document.getElementById("medicine-id").value = med._id;
  document.getElementById("medicine-name").value = med.name;
  document.getElementById("batch-number").value = med.batchNumber;
  document.getElementById("expiry-date").value = med.expiryDate.split("T")[0];
  document.getElementById("quantity").value = med.quantity;
  document.getElementById("unit-price").value = med.unitPrice;
  document.getElementById("category").value = med.category;

  document.getElementById("medicine-modal").style.display = "block";
}

document.getElementById("save-medicine-btn").addEventListener("click", async () => {
  const med = {
    name: document.getElementById("medicine-name").value,
    batchNumber: document.getElementById("batch-number").value,
    expiryDate: document.getElementById("expiry-date").value,
    quantity: Number(document.getElementById("quantity").value),
    unitPrice: Number(document.getElementById("unit-price").value),
    category: document.getElementById("category").value,
  };

  try {
    if (editingMedicineId) {
      await fetch(`${API_BASE}/inventory/${editingMedicineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(med),
      });
    } else {
      await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(med),
      });
    }
    document.getElementById("medicine-modal").style.display = "none";
    fetchMedicines();
  } catch (err) {
    console.error(err);
    alert("Error saving medicine");
  }
});

// ============================
// Delete Medicine
// ============================
async function deleteMedicine(id) {
  if (!confirm("Are you sure you want to delete this medicine?")) return;
  try {
    await fetch(`${API_BASE}/inventory/${id}`, { method: "DELETE" });
    fetchMedicines();
  } catch (err) {
    console.error(err);
    alert("Error deleting medicine");
  }
}

// ============================
// Restock
// ============================
function openRestockModal(id) {
  const med = medicines.find((m) => m._id === id);
  if (!med) return;

  document.getElementById("restock-medicine-id").value = id;
  document.getElementById("restock-medicine-name").value = med.name;
  document.getElementById("current-quantity").value = med.quantity;
  document.getElementById("restock-quantity").value = "";
  document.getElementById("restock-modal").style.display = "block";
}

document.getElementById("confirm-restock-btn").addEventListener("click", async () => {
  const id = document.getElementById("restock-medicine-id").value;
  const qty = Number(document.getElementById("restock-quantity").value);

  try {
    await fetch(`${API_BASE}/inventory/${id}/restock`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    });
    document.getElementById("restock-modal").style.display = "none";
    fetchMedicines();
  } catch (err) {
    console.error(err);
    alert("Error restocking");
  }
});

// ============================
// Prescriptions
// ============================
async function fetchPrescriptions() {
  try {
    const res = await fetch(`${API_BASE}/prescriptions?status=pending`);
    if (!res.ok) throw new Error("Failed to fetch prescriptions");
    prescriptions = await res.json();
    renderPrescriptions();
  } catch (err) {
    console.error(err);
    alert("Error fetching prescriptions");
  }
}

function renderPrescriptions() {
  const tbody = document.getElementById("prescriptions-table-body");
  tbody.innerHTML = "";

  prescriptions.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p._id}</td>
      <td>${p.patient?.firstName || ""} ${p.patient?.lastName || ""}</td>
      <td>${p.doctor?.name || "-"}</td>
      <td>${formatDate(p.date)}</td>
      <td>${p.medicines.map((m) => m.name).join(", ")}</td>
      <td>${p.status}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewPrescription('${p._id}')">View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function viewPrescription(id) {
  const p = prescriptions.find((x) => x._id === id);
  if (!p) return;

  const details = document.getElementById("prescription-details");
  details.innerHTML = `
    <p><strong>Patient:</strong> ${p.patient?.firstName} ${p.patient?.lastName}</p>
    <p><strong>Doctor:</strong> ${p.doctor?.name}</p>
    <p><strong>Date:</strong> ${formatDate(p.date)}</p>
    <p><strong>Medicines:</strong></p>
    <ul>${p.medicines.map((m) => `<li>${m.name} - ${m.dosage}</li>`).join("")}</ul>
  `;

  document.getElementById("prescription-modal").style.display = "block";

  document.getElementById("dispense-prescription-btn").onclick = async () => {
    try {
      await fetch(`${API_BASE}/prescriptions/${id}/dispense`, { method: "PUT" });
      document.getElementById("prescription-modal").style.display = "none";
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      alert("Error dispensing prescription");
    }
  };
}

// ============================
// Helpers
// ============================
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString();
}

// ============================
// Init
// ============================
document.addEventListener("DOMContentLoaded", () => {
  fetchMedicines();
  fetchPrescriptions();

  // Close modals
  document.querySelectorAll(".modal-close, #cancel-btn, #cancel-restock-btn, #close-prescription-btn")
    .forEach((btn) => btn.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach((m) => (m.style.display = "none"));
    }));
});
