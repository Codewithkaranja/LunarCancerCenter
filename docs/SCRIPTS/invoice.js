// ===========================
// billing-upgraded.js (Backend-consistent)
// ===========================

const API_URL = "https://lunar-hmis-backend.onrender.com/api/billing";
let invoices = [];
let currentInvoice = null;
async function findPatientByCode(patientCode) {
  try {
    if (!patientCode) throw new Error("No patient code provided");

    // Clean patient code (remove quotes, extra spaces)
    const cleanCode = patientCode.replace(/["']/g, "").trim();


    const res = await fetch(`https://lunar-hmis-backend.onrender.com/api/patients/${cleanCode}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
      }
    });

    if (!res.ok) {
      console.error(`Backend returned ${res.status} for patientCode "${cleanCode}"`);
      throw new Error("Patient not found");
    }

    const patient = await res.json();
    if (!patient || !patient._id) throw new Error("Invalid patient data received");
    return patient;
  } catch (err) {
    console.error("❌ findPatientByCode error:", err);
    return null;
  }
}

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
    if (!currentInvoice) return alert("No invoice selected");

    switch (action) {
      case "mark as paid":
      case "mark as unpaid":
        const status = action.includes("paid") ? "paid" : "unpaid";
        const updatedInvoice = await updateInvoice(currentInvoice._id, { status });
        if (updatedInvoice) {
          currentInvoice = updatedInvoice;
          renderInvoice();
        }
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
  //document.querySelectorAll(".invoice-actions .btn").forEach(btn => btn.addEventListener("click", exportPDF));

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
// =========================== New Invoice (Safeguarded) ===========================

const newBtn = document.querySelector(".btn-primary");

if (newBtn) {
  newBtn.addEventListener("click", async (e) => {
    e.target.disabled = true;
    try {
      const patientCode = prompt("Enter Patient ID (e.g., PAT0001):");
      if (!patientCode) return alert("Patient ID is required!");

      const patient = await findPatientByCode(patientCode);

      if (!patient) return alert("Patient not found!");

      const confirmed = confirm(`Create invoice for ${patient.firstName} ${patient.lastName}?`);
      if (!confirmed) return;

      const newInvoice = {
        patientId: patient._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        status: "unpaid",
        discount: 0,
        services: [],
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(newInvoice),
      });

      if (!res.ok) throw new Error(`Failed to create invoice: ${res.status}`);

      const saved = await res.json();

      const fullInvoiceRes = await fetch(`${API_URL}/${saved._id}`);
      const fullInvoice = await fullInvoiceRes.json();

      invoices.push(fullInvoice);
      currentInvoice = fullInvoice;
      renderInvoice();

      alert(`✅ New invoice created for ${patient.firstName} ${patient.lastName}`);
    } catch (err) {
      console.error("❌ Error creating invoice:", err);
      alert("Failed to create invoice. Check console for details.");
    } finally {
      e.target.disabled = false;
    }
  });
}




// =========================== Backend Functions
async function fetchInvoices() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    // ✅ Early error detection
    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // ✅ Handle either { invoices: [...] } or raw array
    invoices = Array.isArray(data) ? data : data.invoices || [];

    // ✅ Decide what to render
    if (invoices.length > 0) {
      currentInvoice = invoices[0];
      renderInvoice();
    } else {
      currentInvoice = null;
      const container = document.getElementById("invoiceDetails");
      if (container) {
        container.innerHTML = "<p>No invoices found. Please create one.</p>";
      }
    }

  } catch (err) {
    console.error("❌ Error fetching invoices:", err);
    const container = document.getElementById("invoiceDetails");
    if (container) {
      container.innerHTML = "<p style='color:red;'>⚠️ Failed to fetch invoices. Check backend connection.</p>";
    }
  }
}




async function updateInvoice(id, updates) {
  if (!id) {
    console.error("❌ No invoice ID provided to updateInvoice");
    alert("No invoice selected.");
    return null;
  }

  // ✅ Ensure all services have 'source' if services exist
  if (updates.services && Array.isArray(updates.services)) {
    updates.services = updates.services.map(s => ({
      ...s,
      source: s.source || "manual",
    }));
  }

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem("token") && {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }),
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update invoice: ${res.status} - ${errorText}`);
    }

    const updatedInvoice = await res.json();
    const index = invoices.findIndex(inv => inv._id === id);
    if (index !== -1) invoices[index] = updatedInvoice;
    currentInvoice = updatedInvoice;
    renderInvoice();
    console.log("✅ Invoice updated successfully:", updatedInvoice);
    return updatedInvoice;
  } catch (err) {
    console.error("Error updating invoice:", err);
    alert("⚠️ Unable to update invoice. See console for details.");
    return null;
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
  const tbody = document.querySelector(".billing-table tbody");
  const tbodyInvoice = document.querySelector(".invoice-billing-table tbody");
  const invoiceTotalEl = document.querySelector(".invoice-total");
  const statusEl = document.querySelector(".payment-status");
  const summaryCards = document.querySelectorAll(".billing-summary .summary-card p");
  const patientNameEl = document.getElementById("patientNameDisplay");
  const patientInfoEl = document.getElementById("patientInfoDisplay");
  const billToEl = document.getElementById("billToSection");

  const clearTable = (tableEl, colSpan, message) => {
    if (tableEl) tableEl.innerHTML = `<tr><td colspan='${colSpan}' class='text-center'>${message}</td></tr>`;
  };

  const formatKES = (amount) => Number(amount || 0).toLocaleString() + " KES";


  // ===== No invoice fallback =====
  if (!currentInvoice) {
    clearTable(tbody, 7, "No invoice selected");
    clearTable(tbodyInvoice, 6, "No invoice selected");
    if (invoiceTotalEl) invoiceTotalEl.innerHTML = "<p>No invoice data</p>";
    if (statusEl) {
      statusEl.textContent = "N/A";
      statusEl.className = "payment-status status-na";
    }
    summaryCards.forEach(p => (p.textContent = "0 KES"));
    if (billToEl) billToEl.innerHTML = "<p>No patient selected</p>";
    if (patientNameEl) patientNameEl.textContent = "— No patient selected —";
    if (patientInfoEl) patientInfoEl.textContent = "Age: — | Phone: — | Last Visit: —";
    return;
  }

  const services = Array.isArray(currentInvoice.services) ? currentInvoice.services : [];

  // ===== Render Table Rows =====
  const renderRows = (tableEl, colCount, rows) => {
    if (!tableEl) return;
    if (rows.length === 0) {
      clearTable(tableEl, colCount, "No services added");
    } else {
      tableEl.innerHTML = rows.map(s => {
        const total = (s.qty || 0) * (s.unitPrice || 0);
        return `
          <tr>
            <td>${s.date ? new Date(s.date).toLocaleDateString() : "-"}</td>
            <td>${s.service || "-"}</td>
            <td>${s.desc || "-"}</td>
            <td>${s.qty || 0}</td>
            <td>${(s.unitPrice || 0).toLocaleString()}</td>
            <td>${total.toLocaleString()}</td>
            ${tableEl === tbody ? `<td class="action-cell">
              <button class="action-btn btn-edit"><i class="fas fa-edit"></i></button>
              <button class="action-btn btn-delete"><i class="fas fa-trash"></i></button>
            </td>` : ""}
          </tr>
        `;
      }).join("");
    }
  };

  renderRows(tbody, 7, services);
  renderRows(tbodyInvoice, 6, services);

  // ===== Patient Header =====
  const patientObj = currentInvoice.patientId && typeof currentInvoice.patientId === "object"
    ? currentInvoice.patientId
    : {};

  // Extract system ID safely from backend object
  const systemId = patientObj.patientId || patientObj._id || 
                   (typeof currentInvoice.patientId === "string" ? currentInvoice.patientId : "N/A");

  const firstName = patientObj.firstName || "";
  const lastName = patientObj.lastName || "";
  const name = currentInvoice.patientName || `${firstName} ${lastName}`.trim() || "—";


  const age = patientObj.age || "—";
  const phone = patientObj.phone || "—";
  const lastVisit = patientObj.updatedAt ? new Date(patientObj.updatedAt).toLocaleDateString() : "—";
  const address = patientObj.address || "—";
  const email = patientObj.email || "—";

  // ===== Update DOM =====
  if (patientNameEl) {
    patientNameEl.style.opacity = 0;
    patientNameEl.textContent = `${name} (ID: ${systemId})`;
    setTimeout(() => patientNameEl.style.opacity = 1, 50);
  }

  if (patientInfoEl) {
    patientInfoEl.style.opacity = 0;
    patientInfoEl.textContent = `Age: ${age} | Phone: ${phone} | Last Visit: ${lastVisit}`;
    setTimeout(() => patientInfoEl.style.opacity = 1, 50);
  }

  if (billToEl) {
    billToEl.style.opacity = 0;
    billToEl.innerHTML = `
      <h4>Bill To:</h4>
      <p>${name}</p>
      <p>${address}</p>
      <p>Phone: ${phone}</p>
      <p>Email: ${email}</p>
    `;
    setTimeout(() => billToEl.style.opacity = 1, 50);
  }

  // ===== Totals =====
  const totals = calculateTotals(currentInvoice);
  if (summaryCards.length >= 4) {
    summaryCards[0].textContent = formatKES(totals.subtotal);
    summaryCards[1].textContent = formatKES(totals.tax);
    summaryCards[3].textContent = formatKES(totals.total);
  }

  if (invoiceTotalEl) {
    invoiceTotalEl.innerHTML = `
      <p>Subtotal: ${formatKES(totals.subtotal)}</p>
      <p>Tax (16%): ${formatKES(totals.tax)}</p>
      <p>Discount: ${formatKES(currentInvoice.discount)}</p>
      <p><strong>Total: ${formatKES(totals.total)}</strong></p>
    `;
  }

  // ===== Payment Status =====
  if (statusEl) {
    const paid = currentInvoice.status === "paid";
    statusEl.textContent = paid ? "Paid" : "Unpaid";
    statusEl.className = `payment-status status-${paid ? "paid" : "unpaid"}`;
  }
}

// =========================== Calculate Totals
function calculateTotals(invoice) {
  const services = Array.isArray(invoice.services) ? invoice.services : [];
  const subtotal = services.reduce(
    (acc, s) => acc + ((Number(s.qty) || 0) * (Number(s.unitPrice) || 0)),
    0
  );
  const tax = Math.round(subtotal * 0.16);
  const total = Math.round((subtotal + tax - (Number(invoice.discount) || 0)) * 100) / 100;
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
  const newQty = parseInt(prompt("Enter Quantity:", qty)) || 1;
  const newPrice = parseFloat(prompt("Enter Unit Price:", price)) || 1000;
  
  // 🟢 Add this prompt for source selection
  const newSource = prompt(
    "Enter Source (pharmacy, lab, consultation, other):",
    service?.source || "other"
  );

  // ✅ sanitize and ensure it's valid
  const validSources = ["pharmacy", "lab", "consultation", "other"];
  const source =
    validSources.includes(newSource?.toLowerCase()) 
      ? newSource.toLowerCase() 
      : "other";

  const serviceObj = {
    date: new Date(),
    service: newService,
    desc: newDesc,
    qty: newQty,
    unitPrice: newPrice,
    source, // ✅ valid and aligned with backend schema
  };

  if (index !== null) {
    currentInvoice.services[index] = serviceObj;
  } else {
    currentInvoice.services.push(serviceObj);
  }

  // ✅ Ensure every service still has a valid source
  currentInvoice.services = currentInvoice.services.map(s => ({
    ...s,
    source: validSources.includes(s.source) ? s.source : "other",
  }));

  currentInvoice = await updateInvoice(currentInvoice._id, {
    services: currentInvoice.services,
  });

  renderInvoice();
}

async function openDiscountModal() {
  const newDiscount = parseFloat(prompt("Enter discount amount:", currentInvoice.discount || 0));
  if (isNaN(newDiscount)) return;

  currentInvoice.discount = newDiscount;

  // ✅ Ensure all services have a valid source before update
  currentInvoice.services = currentInvoice.services.map(s => ({
    ...s,
    source: s.source || "other"

  }));

  currentInvoice = await updateInvoice(currentInvoice._id, {
    discount: newDiscount,
    services: currentInvoice.services
  });

  renderInvoice();
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

// ✅ Logout handler (safe and consistent)
function handleLogout() {
  localStorage.removeItem("token");
  sessionStorage.clear();
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
    console.log("✅ Logout listener attached"); // for debugging
  } else {
    console.warn("⚠️ Logout button not found in DOM.");
  }
});


})
