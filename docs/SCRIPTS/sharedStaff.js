// sharedStaff.js
const API_BASE = "https://lunar-hmis-backend.onrender.com/api";

export let staffList = [];

// Fetch staff once and cache it
export async function loadStaff() {
  try {
    const res = await fetch(`${API_BASE}/staff?populate=appointments,prescriptions,labReports,dispenses,inventoryChanges,patients,reports,invoice`);
    if (!res.ok) throw new Error("Failed to fetch staff");
    const data = await res.json();
    staffList = data.staff || data || []; // ensure it's an array
    return staffList;
  } catch (err) {
    console.error("Error loading staff:", err);
    staffList = [];
    return [];
  }
}


// Populate <select> dropdowns
export function populateStaffDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = `<option value="">Select Staff</option>`;
  staffList.forEach(s => {
    const option = document.createElement("option");
    option.value = s._id;
    option.textContent = `${s.firstName} ${s.lastName || ""} (${s.role})`;
    select.appendChild(option);
  });
}
