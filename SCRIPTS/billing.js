// ===========================
// billing-upgraded.js
// ===========================

document.addEventListener("DOMContentLoaded", function () {
  // Get user role from localStorage (set during login)
  const userRole = localStorage.getItem("userRole") || "cashier";
  const userName = localStorage.getItem("userName") || "Cashier Mary";

  // Update user info in header
  document.querySelector(".user-details h3").textContent = userName;
  document.querySelector(".user-details p").textContent =
    userRole.charAt(0).toUpperCase() + userRole.slice(1) + " / Finance Staff";

  // Payment action buttons
  document.querySelectorAll(".action-card").forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.querySelector("h3").textContent.toLowerCase();
      switch (action) {
        case "mark as paid":
          currentInvoice.status = "paid";
          renderInvoice();
          break;
        case "mark as unpaid":
          currentInvoice.status = "unpaid";
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

  // Export / Print buttons
  document.querySelector(".btn-success")?.addEventListener("click", exportCSV);
  document.querySelector(".btn-warning")?.addEventListener("click", exportPDF);
  document.querySelectorAll(".invoice-actions .btn").forEach(btn => {
    btn.addEventListener("click", exportPDF);
  });

  // Search
  document.querySelector(".search-btn")?.addEventListener("click", () => {
    const idSearch = document.getElementById("patient-id").value.toLowerCase();
    const nameSearch = document.getElementById("patient-name").value.toLowerCase();
    if (
      currentInvoice.patientId.toLowerCase().includes(idSearch) &&
      currentInvoice.patientName.toLowerCase().includes(nameSearch)
    ) {
      alert("Patient found: " + currentInvoice.patientName);
    } else alert("No matching patient found");
  });

  // New Invoice
  document.querySelector(".btn-primary")?.addEventListener("click", () => {
    const patientName = prompt("Enter Patient Name:");
    const patientId = prompt("Enter Patient ID:");
    if (!patientName || !patientId) return alert("Patient info required!");

    const newInvoice = {
      id: `INV-${Math.floor(Math.random() * 10000)}`,
      patientName,
      patientId,
      date: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: "unpaid",
      discount: 0,
      services: []
    };
    invoices.push(newInvoice);
    currentInvoice = newInvoice;
    renderInvoice();
    alert("New invoice created for " + patientName);
  });
});

// ===========================
// Invoice Data
// ===========================
let invoices = [
  {
    id: "INV-2025-0012",
    patientName: "John Doe",
    patientId: "P12345",
    date: "15 Nov 2025",
    dueDate: "22 Nov 2025",
    status: "unpaid",
    discount: 0,
    services: [
      { date: "12 Nov 2025", service: "Oncology Consultation", desc: "Initial consultation", qty: 1, unitPrice: 2500 },
      { date: "13 Nov 2025", service: "Lab Test", desc: "Blood work", qty: 1, unitPrice: 5000 },
      { date: "14 Nov 2025", service: "Chemotherapy", desc: "First cycle", qty: 1, unitPrice: 15000 },
      { date: "15 Nov 2025", service: "Medication", desc: "Pain management", qty: 2, unitPrice: 1200 }
    ]
  }
];

let currentInvoice = invoices[0];

// ===========================
// Render Invoice (Unified)
// ===========================
function renderInvoice() {
  // --- Main Billing Table ---
  const tbody = document.querySelector(".billing-table tbody");
  if (tbody) {
    tbody.innerHTML = "";
    currentInvoice.services.forEach((service, index) => {
      const total = service.qty * service.unitPrice;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${service.date}</td>
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

  // --- Invoice Preview Table ---
  const tbodyInvoice = document.querySelector(".invoice-billing-table tbody");
  if (tbodyInvoice) {
    tbodyInvoice.innerHTML = currentInvoice.services.map(s => `
      <tr>
        <td>${s.date}</td>
        <td>${s.service}</td>
        <td>${s.desc}</td>
        <td>${s.qty}</td>
        <td>${s.unitPrice.toLocaleString()}</td>
        <td>${(s.qty * s.unitPrice).toLocaleString()}</td>
      </tr>
    `).join("");
  }

  // --- Totals ---
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

  // --- Payment Status ---
  const statusEl = document.querySelector(".payment-status");
  if (statusEl) {
    statusEl.textContent = currentInvoice.status === "paid" ? "Paid" : "Unpaid";
    statusEl.className = `payment-status status-${currentInvoice.status}`;
  }
}

// ===========================
// Calculate Totals
// ===========================
function calculateTotals(invoice) {
  const subtotal = invoice.services.reduce((acc, s) => acc + s.qty * s.unitPrice, 0);
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax - (invoice.discount || 0);
  return { subtotal, tax, total };
}

// ===========================
// Event Delegation for Edit/Delete
// ===========================
document.querySelector(".billing-table tbody")?.addEventListener("click", e => {
  const row = e.target.closest("tr");
  if (!row) return;
  const index = Array.from(row.parentNode.children).indexOf(row);

  if (e.target.closest(".btn-delete")) {
    if (confirm("Are you sure you want to delete this service?")) {
      currentInvoice.services.splice(index, 1);
      renderInvoice();
    }
  }

  if (e.target.closest(".btn-edit")) {
    openServiceModal(currentInvoice.services[index], index);
  }
});

// ===========================
// Service / Discount Modals
// ===========================
function openServiceModal(service = null, index = null) {
  const serviceName = service ? service.service : "";
  const desc = service ? service.desc : "";
  const qty = service ? service.qty : 1;
  const price = service ? service.unitPrice : 1000;
  const newService = prompt(`Enter Service Name:`, serviceName);
  if (!newService) return;
  const newDesc = prompt("Enter Description:", desc);
  const newQty = parseInt(prompt("Enter Quantity:", qty));
  const newPrice = parseFloat(prompt("Enter Unit Price:", price));

  const serviceObj = {
    date: new Date().toLocaleDateString(),
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
  renderInvoice();
}

function openDiscountModal() {
  const discount = parseFloat(prompt("Enter discount amount:", currentInvoice.discount || 0));
  if (!isNaN(discount)) {
    currentInvoice.discount = discount;
    renderInvoice();
  }
}

// ===========================
// Export Functions
// ===========================
function exportCSV() {
  let csv = "Date,Service,Description,Quantity,Unit Price,Amount\n";
  currentInvoice.services.forEach(s => {
    csv += `${s.date},${s.service},${s.desc},${s.qty},${s.unitPrice},${s.qty*s.unitPrice}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${currentInvoice.id}.csv`;
  link.click();
}

function exportPDF() {
  const printWindow = window.open("", "", "height=600,width=800");
  printWindow.document.write("<html><head><title>Invoice</title></head><body>");
  printWindow.document.write(document.querySelector(".invoice-preview").innerHTML);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.print();
}

// ===========================
// Initial Render
// ===========================
renderInvoice();
