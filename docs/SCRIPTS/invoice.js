// ===========================
// billing-upgraded.js (Backend-consistent)
// ===========================

const API_URL = "https://lunar-hmis-backend.onrender.com/api/billing";
let invoices = [];
let currentInvoice = null;

document.addEventListener("DOMContentLoaded", async function () {
  const userRole = localStorage.getItem("userRole") || "cashier";
  const userName = localStorage.getItem("userName") || "Cashier Mary";

  document.querySelector(".user-details h3").textContent = userName;
  document.querySelector(".user-details p").textContent =
    `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} / Finance Staff`;

  await fetchInvoices();

  document.querySelectorAll(".action-card").forEach(card => {
    card.addEventListener("click", async () => {
      const action = card.querySelector("h3").textContent.toLowerCase();
      switch (action) {
        case "mark as paid":
        case "mark as unpaid":
          currentInvoice.status = action.includes("paid") ? "paid" : "unpaid";
          currentInvoice = await updateInvoice(currentInvoice._id, { status: currentInvoice.status });
          renderInvoice();
          break;
        case "add service":
          openServiceModal();
          break;
        case "apply discount":
          openDiscountModal();
          break;
        case "insurance":
          alert("Insurance applied (example)");
          break;
        case "generate invoice":
          alert("Invoice generated (example)");
          break;
      }
    });
  });

  document.querySelector(".btn-success")?.addEventListener("click", exportCSV);
  document.querySelector(".btn-warning")?.addEventListener("click", exportPDF);
  document.querySelectorAll(".invoice-actions .btn").forEach(btn => btn.addEventListener("click", exportPDF));

  // =========================== Search
  document.querySelector(".search-btn")?.addEventListener("click", () => {
    const idSearch = document.getElementById("patient-id").value.toLowerCase();
    const nameSearch = document.getElementById("patient-name").value.toLowerCase();

    const found = invoices.find(inv => {
      const patientIdStr = inv.patientId?.patientId?.toLowerCase() || "";
      const patientNameStr = inv.patientName?.toLowerCase() || "";
      return patientIdStr.includes(idSearch) && patientNameStr.includes(nameSearch);
    });

    if (found) {
      currentInvoice = found;
      renderInvoice();
      alert("Patient found: " + currentInvoice.patientName);
    } else {
      alert("No matching patient found");
    }
  });

  // =========================== New Invoice
  document.querySelector(".btn-primary")?.addEventListener("click", async () => {
    const patientName = prompt("Enter Patient Name:");
    const patientIdInput = prompt("Enter Patient ID:");
    if (!patientName || !patientIdInput) return alert("Patient info required!");

    const newInvoice = {
      patientName,
      patientId: patientIdInput,
      date: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "unpaid",
      discount: 0,
      services: []
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInvoice)
    });
    const saved = await res.json();

    // Fetch full invoice with populated patientId
    const fullInvoiceRes = await fetch(`${API_URL}/${saved._id}`);
    const fullInvoice = await fullInvoiceRes.json();

    invoices.push(fullInvoice);
    currentInvoice = fullInvoice;
    renderInvoice();
    alert("New invoice created for " + patientName);
  });
});

// =========================== Backend Functions
async function fetchInvoices() {
  try {
    const res = await fetch(API_URL);
    invoices = await res.json();
    currentInvoice = invoices[0] || null;
    if (currentInvoice) renderInvoice();
  } catch (err) {
    console.error("Error fetching invoices:", err);
  }
}

async function updateInvoice(id, updates) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    const updated = await res.json();

    // Fetch fully populated invoice after update
    const fullInvoiceRes = await fetch(`${API_URL}/${updated._id}`);
    const fullInvoice = await fullInvoiceRes.json();

    const idx = invoices.findIndex(inv => inv._id === id);
    if (idx >= 0) invoices[idx] = fullInvoice;

    return fullInvoice;
  } catch (err) {
    console.error("Error updating invoice:", err);
  }
}

async function deleteInvoice(id) {
  try {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    invoices = invoices.filter(inv => inv._id !== id);
    currentInvoice = invoices[0] || null;
    renderInvoice();
  } catch (err) {
    console.error("Error deleting invoice:", err);
  }
}

// =========================== Render Invoice
function renderInvoice() {
  if (!currentInvoice) return;

  // Main billing table
  const tbody = document.querySelector(".billing-table tbody");
  if (tbody) {
    tbody.innerHTML = "";
    currentInvoice.services.forEach((service, index) => {
      const total = service.qty * service.unitPrice;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(service.date).toLocaleDateString()}</td>
        <td>${service.service}</td>
        <td>${service.desc}</td>
        <td>${service.qty}</td>
        <td>${service.unitPrice.toLocaleString()}</td>
        <td>${total.toLocaleString()}</td>
        <td class="action-cell">
          <button class="action-btn btn-edit"><i class="fas fa-edit"></i></button>
          <button class="action-btn btn-delete"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Invoice preview table
  const tbodyInvoice = document.querySelector(".invoice-billing-table tbody");
  if (tbodyInvoice) {
    tbodyInvoice.innerHTML = currentInvoice.services.map(s => `
      <tr>
        <td>${new Date(s.date).toLocaleDateString()}</td>
        <td>${s.service}</td>
        <td>${s.desc}</td>
        <td>${s.qty}</td>
        <td>${s.unitPrice.toLocaleString()}</td>
        <td>${(s.qty * s.unitPrice).toLocaleString()}</td>
      </tr>
    `).join("");
  }

  const totals = calculateTotals(currentInvoice);
  const summaryCards = document.querySelectorAll(".billing-summary .summary-card p");
  if (summaryCards.length >= 4) {
    summaryCards[0].textContent = totals.subtotal.toLocaleString() + " KES";
    summaryCards[1].textContent = totals.tax.toLocaleString() + " KES";
    summaryCards[3].textContent = totals.total.toLocaleString() + " KES";
  }

  const invoiceTotal = document.querySelector(".invoice-total");
  if (invoiceTotal) {
    invoiceTotal.innerHTML = `
      <p>Subtotal: ${totals.subtotal.toLocaleString()} KES</p>
      <p>Tax (16%): ${totals.tax.toLocaleString()} KES</p>
      <p>Discount: ${currentInvoice.discount.toLocaleString()} KES</p>
      <p>Total: ${totals.total.toLocaleString()} KES</p>
    `;
  }

  const statusEl = document.querySelector(".payment-status");
  if (statusEl) {
    statusEl.textContent = currentInvoice.status === "paid" ? "Paid" : "Unpaid";
    statusEl.className = `payment-status status-${currentInvoice.status}`;
  }
}

// =========================== Calculate Totals
function calculateTotals(invoice) {
  const subtotal = invoice.services.reduce((acc, s) => acc + s.qty * s.unitPrice, 0);
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax - (invoice.discount || 0);
  return { subtotal, tax, total };
}

// =========================== Edit/Delete Events
document.querySelector(".billing-table tbody")?.addEventListener("click", async e => {
  const row = e.target.closest("tr");
  if (!row) return;
  const index = Array.from(row.parentNode.children).indexOf(row);

  if (e.target.closest(".btn-delete")) {
    if (confirm("Are you sure you want to delete this service?")) {
      currentInvoice.services.splice(index, 1);
      currentInvoice = await updateInvoice(currentInvoice._id, { services: currentInvoice.services });
      renderInvoice();
    }
  }

  if (e.target.closest(".btn-edit")) {
    openServiceModal(currentInvoice.services[index], index);
  }
});

// =========================== Service / Discount Modals
async function openServiceModal(service = null, index = null) {
  const serviceName = service?.service || "";
  const desc = service?.desc || "";
  const qty = service?.qty || 1;
  const price = service?.unitPrice || 1000;

  const newService = prompt(`Enter Service Name:`, serviceName);
  if (!newService) return;
  const newDesc = prompt("Enter Description:", desc);
  const newQty = parseInt(prompt("Enter Quantity:", qty));
  const newPrice = parseFloat(prompt("Enter Unit Price:", price));

  const serviceObj = {
    date: new Date(),
    service: newService,
    desc: newDesc,
    qty: newQty,
    unitPrice: newPrice
  };

  if (index !== null) {
    currentInvoice.services[index] = serviceObj;
  } else {
    currentInvoice.services.push(serviceObj);
  }

  currentInvoice = await updateInvoice(currentInvoice._id, { services: currentInvoice.services });
  renderInvoice();
}

async function openDiscountModal() {
  const discount = parseFloat(prompt("Enter discount amount:", currentInvoice.discount || 0));
  if (!isNaN(discount)) {
    currentInvoice.discount = discount;
    currentInvoice = await updateInvoice(currentInvoice._id, { discount });
    renderInvoice();
  }
}

// =========================== Export CSV
async function exportCSV() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/export/csv`, { headers: { "Authorization": `Bearer ${token}` } });
    if (!res.ok) throw new Error("Failed to export CSV");

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  } catch (err) {
    console.error("CSV export error:", err);
    alert("Failed to export invoices CSV. Please try again.");
  }
}

// =========================== Export PDF
async function exportPDF() {
  try {
    if (!currentInvoice || !currentInvoice._id) return alert("No invoice selected!");
    const res = await fetch(`${API_URL}/export/pdf`, { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } });
    if (!res.ok) throw new Error("Failed to generate PDF");

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoice_${currentInvoice._id}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Error exporting PDF:", err);
    alert("Failed to export PDF. Check console for details.");
  }
}
