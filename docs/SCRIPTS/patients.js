// ==========================
// patients.js (Clean & Optimized)
// ==========================

// Base API URL
const API_BASE = "https://lunar-hmis-backend.onrender.com";

// Global state
let currentPage = 1;
const patientsPerPage = 5;
let allPatients = [];
let filteredPatients = [];
let currentSort = { column: null, direction: 'asc' };
let userRole = 'doctor'; // Should come from auth
let totalCount = 0;

// RBAC Configuration
const rbacConfig = {
  doctor: { can: ['view_patients','add_patients','edit_patients','view_prescriptions','edit_prescriptions','view_billing','export_data'] },
  nurse: { can: ['view_patients','add_patients','edit_patients','view_prescriptions'] },
  admin: { can: ['view_patients','add_patients','edit_patients','delete_patients','view_prescriptions','view_billing','export_data','manage_all'] },
  pharmacist: { can: ['view_patients','view_prescriptions','edit_prescriptions'] }
};

// --------------------------
// Utilities
// --------------------------
function checkPermission(action) {
  return rbacConfig[userRole]?.can.includes(action) || false;
}



function formatDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date) ? 'N/A' : date.toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' });
}

function calculateAge(dob) {
  if (!dob) return 'N/A';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function generatePatientId() {
  const numericIds = allPatients.map(p => {
    const match = (p.id || p._id || "").match(/\d+$/);
    return match ? parseInt(match[0],10) : null;
  }).filter(n => n !== null);
  const maxId = numericIds.length ? Math.max(...numericIds) : 0;
  return `PAT${String(maxId+1).padStart(4,'0')}`;
}
function normalizeId(patient) {
  return patient._id; // always backend ID
}
function displayPatientId(patient) {
  // Use the patientId if provided, otherwise create one from last 4 chars of _id
  return patient.patientId || `PAT${String(patient._id).slice(-4).toUpperCase()}`;
}
// --------------------------
// Initialization
// --------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadPatients();
  setupEventListeners();
  applyRBAC();
});

// --------------------------
// Fetch & Render
// --------------------------
async function loadPatients(page = currentPage) {
  const searchText = document.getElementById("search-name").value.toLowerCase();
  const diagnosisFilter = document.getElementById("filter-diagnosis").value;
  const statusFilter = document.getElementById("filter-status").value;

  const query = new URLSearchParams({
    search: searchText,
    diagnosis: diagnosisFilter,
    status: statusFilter,
    sortColumn: currentSort.column || '',
    sortDirection: currentSort.direction || 'asc',
    page: page,
    limit: patientsPerPage
  });

  try {
    const res = await fetch(`${API_BASE}/api/patients?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch patients");
    const data = await res.json();

    allPatients = data.patients || [];
    filteredPatients = [...allPatients];
    totalCount = data.totalCount || filteredPatients.length;
    currentPage = data.page || page;

    renderPatients();
    renderPagination(data.page || page, data.totalPages || 1, totalCount);
  } catch (err) {
    console.error(err);
    allPatients = [];
    filteredPatients = [];
    totalCount = 0;
    renderPatients();
    renderPagination(1,1,0);
  }
}

// Render Patients Table
// --------------------------
function renderPatients() {
  const tbody = document.querySelector('.patients-table tbody');
  tbody.innerHTML = '';

  filteredPatients.forEach(patient => {
    const statusClass = `status-${patient.status}`;
    const statusText = patient.status ? patient.status[0].toUpperCase() + patient.status.slice(1) : 'N/A';
    const backendId = normalizeId(patient);   // For buttons/API calls
    const displayId = displayPatientId(patient); // For table display

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${displayId}</td>
      <td>${patient.firstName} ${patient.lastName}</td>
      <td>${calculateAge(patient.dob)}/${patient.gender || 'N/A'}</td>
      <td>${patient.diagnosis || 'N/A'}</td>
      <td>${patient.stage || 'N/A'}</td>
      <td>${patient.doctor || 'N/A'}</td>
      <td>${formatDate(patient.nextAppointment)}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td class="action-cell">
        ${checkPermission('view_patients') ? `<button class="action-btn btn-view" data-id="${backendId}"><i class="fas fa-eye"></i></button>` : ''}
        ${checkPermission('edit_patients') ? `<button class="action-btn btn-edit" data-id="${backendId}"><i class="fas fa-edit"></i></button>` : ''}
        ${checkPermission('delete_patients') ? `<button class="action-btn btn-delete" data-id="${backendId}"><i class="fas fa-trash"></i></button>` : ''}
        ${checkPermission('view_prescriptions') ? `<button class="action-btn btn-prescription" data-id="${backendId}"><i class="fas fa-prescription-bottle-alt"></i></button>` : ''}
        ${checkPermission('view_billing') ? `<button class="action-btn btn-billing" data-id="${backendId}"><i class="fas fa-file-invoice"></i></button>` : ''}
      </td>
    `;
    tbody.appendChild(row);
  });

  attachRowListeners();
}


// --------------------------
// Pagination
// --------------------------
function renderPagination(current, totalPages, totalCount) {
  const container = document.getElementById("pagination");
  const info = document.getElementById("pagination-info");
  info.textContent = totalCount > 0 ? `Showing ${(current-1)*patientsPerPage+1}-${Math.min(current*patientsPerPage,totalCount)} of ${totalCount} patients` : "No patients found";

  if (totalPages <= 1) { container.innerHTML=''; return; }

  let html = `<button class="pagination-btn prev-btn ${current===1?'disabled':''}">&laquo; Previous</button>`;
  const maxVisible = 5;
  let start = Math.max(1, current-Math.floor(maxVisible/2));
  let end = Math.min(totalPages, start+maxVisible-1);
  if(end-start+1 < maxVisible) start = Math.max(1,end-maxVisible+1);
  if(start>1) html += `<button class="pagination-btn page-btn" data-page="1">1</button><span class="ellipsis">...</span>`;
  for(let i=start;i<=end;i++) html += `<button class="pagination-btn page-btn ${i===current?'active':''}" data-page="${i}">${i}</button>`;
  if(end<totalPages) html += `<span class="ellipsis">...</span><button class="pagination-btn page-btn" data-page="${totalPages}">${totalPages}</button>`;
  html += `<button class="pagination-btn next-btn ${current===totalPages?'disabled':''}">Next &raquo;</button>`;
  container.innerHTML = html;

  container.querySelector(".prev-btn")?.addEventListener("click", ()=>{if(current>1) loadPatients(current-1);});
  container.querySelectorAll(".page-btn").forEach(btn=>btn.addEventListener("click", ()=>{const p=parseInt(btn.dataset.page,10); if(p!==current) loadPatients(p);}));
  container.querySelector(".next-btn")?.addEventListener("click", ()=>{if(current<totalPages) loadPatients(current+1);});
}

// --------------------------
// Search & Sort
// --------------------------
async function handleSearch() { currentPage=1; await loadPatients(); }

function handleSort(column) {
  const map = {'Patient ID':'id','Name':'lastName','Age/Gender':'age','Diagnosis':'diagnosis','Stage':'stage','Doctor':'doctor','Next Appointment':'nextAppointment','Status':'status','Created At':'createdAt'};
  const field = map[column]; if(!field) return;
  const direction = currentSort.column===field && currentSort.direction==='asc'?'desc':'asc';
  applySort(field,direction);
}

function handleSortDropdown(value) {
  const map = {'Sort by: Newest First':{field:'createdAt',direction:'desc'},'Sort by: Oldest First':{field:'createdAt',direction:'asc'},'Sort by: Name A-Z':{field:'lastName',direction:'asc'},'Sort by: Name Z-A':{field:'lastName',direction:'desc'},'Sort by: Patient ID':{field:'id',direction:'asc'}};
  const sortConfig = map[value]; if(!sortConfig) return; applySort(sortConfig.field,sortConfig.direction);
}

function applySort(field,direction){currentSort={column:field,direction:direction}; loadPatients(currentPage);}

// --------------------------
// Row actions
// --------------------------
function attachRowListeners() {
  document.querySelectorAll('.btn-view').forEach(btn => 
    btn.addEventListener('click', () => viewPatient(btn.dataset.id))
  );
  document.querySelectorAll('.btn-edit').forEach(btn => 
    btn.addEventListener('click', () => editPatient(btn.dataset.id))
  );
  document.querySelectorAll('.btn-delete').forEach(btn => 
    btn.addEventListener('click', () => deletePatient(btn.dataset.id))
  );
  document.querySelectorAll('.btn-prescription').forEach(btn => 
    btn.addEventListener('click', () => handlePrescription(btn.dataset.id))
  );
  document.querySelectorAll('.btn-billing').forEach(btn => 
    btn.addEventListener('click', () => handleBilling(btn.dataset.id))
  );
}


async function viewPatient(id){
  try{
    const res = await fetch(`${API_BASE}/api/patients/${id}`);
    const data = await res.json();
    if(!data.success){alert(data.message||"Patient not found");return;}
    const p = data.patient;
    alert(`Viewing patient: ${p.firstName} ${p.lastName}\nID: ${p.patientId}\nDiagnosis: ${p.diagnosis||'N/A'}`);
  }catch(err){console.error(err);alert("Failed to fetch patient data.");}
}

async function editPatient(id){
  try{
    const res = await fetch(`${API_BASE}/api/patients/${id}`);
    const data = await res.json();
    if(!data.success){alert(data.message||"Patient not found");return;}
    const p = data.patient;
    const modal = document.getElementById("patientModal");
    modal.dataset.patientId = normalizeId(p);
    document.querySelector(".modal-title").textContent="Edit Patient";
    ["first-name","last-name","dob","gender","phone","email","address","diagnosis","diagnosis-date","stage","treatment-plan","allergies","medical-history","insurance-provider","insurance-id","coverage","valid-until","doctor","status","next-appointment"].forEach(field=>{
      const el = document.getElementById(field);
      if(el) el.value = p[field] || (p[field+"Date"]?p[field+"Date"].split("T")[0]:'');
    });
    openModal();
  }catch(err){console.error(err);alert("Failed to fetch patient data.");}
}

// --------------------------
// Save patient
// --------------------------
async function savePatient(){
  const modal = document.getElementById("patientModal");
  const patientId = modal.dataset.patientId;
  const isEditing = !!patientId;

  const patientData = {
    firstName: document.getElementById("first-name").value.trim(),
    lastName: document.getElementById("last-name").value.trim(),
    dob: document.getElementById("dob").value?new Date(document.getElementById("dob").value).toISOString():null,
    gender: document.getElementById("gender").value,
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim(),
    diagnosis: document.getElementById("diagnosis").value.trim(),
    diagnosisDate: document.getElementById("diagnosis-date").value?new Date(document.getElementById("diagnosis-date").value).toISOString():null,
    stage: document.getElementById("stage").value,
    treatmentPlan: document.getElementById("treatment-plan").value,
    allergies: document.getElementById("allergies").value.trim(),
    medicalHistory: document.getElementById("medical-history").value.trim(),
    insuranceProvider: document.getElementById("insurance-provider").value.trim(),
    insuranceId: document.getElementById("insurance-id").value.trim(),
    coverage: document.getElementById("coverage").value,
    validUntil: document.getElementById("valid-until").value?new Date(document.getElementById("valid-until").value).toISOString():null,
    status: document.getElementById("status")?.value || "active",
    doctor: document.getElementById("doctor").value || null,
    nextAppointment: document.getElementById("next-appointment").value?new Date(document.getElementById("next-appointment").value).toISOString():null
  };

  if(!patientData.firstName || !patientData.lastName || !patientData.dob || !patientData.diagnosis || !patientData.diagnosisDate || !patientData.stage || !patientData.treatmentPlan || !patientData.gender){
    alert("Please fill all required fields"); return;
  }

  try{
    const url = isEditing ? `${API_BASE}/api/patients/${patientId}` : `${API_BASE}/api/patients`;
    const method = isEditing?"PUT":"POST";
    const res = await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(patientData)});
    if(!res.ok){const errData=await res.json().catch(()=>({}));throw new Error(errData.error||"Unsuccessful");}
    await loadPatients();
    closeModal();
  }catch(err){console.error(err);alert("Save failed: "+err.message);}
}
// Delete Patient
// --------------------------
async function deletePatient(id) {
  if(!confirm("Are you sure you want to delete this patient?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/patients/${id}`, { method: 'DELETE' });
    if(!res.ok) throw new Error("Failed to delete patient");
    await loadPatients(currentPage);
    alert("Patient deleted successfully");
  } catch(err) {
    console.error(err);
    alert("Delete failed: " + err.message);
  }
}



// --------------------------
// Export
// --------------------------
function exportCSV(){
  if(!checkPermission('export_data')){alert('Unauthorized');return;}
  const headers = ['ID','First Name','Last Name','Age','Gender','Diagnosis','Stage','Doctor','Next Appointment','Status','Phone','Email','Address','Diagnosis Date','Treatment Plan','Allergies','Medical History','Insurance Provider','Insurance ID','Coverage','Valid Until'];
  const csvData = filteredPatients.map(p=>[normalizeId(p),p.firstName,p.lastName,calculateAge(p.dob),p.gender,p.diagnosis,p.stage,p.doctor,formatDate(p.nextAppointment),p.status,p.phone,p.email,p.address,p.diagnosisDate,p.treatmentPlan,p.allergies,p.medicalHistory,p.insuranceProvider,p.insuranceId,p.coverage,p.validUntil]);
  const csvContent = [headers,...csvData].map(r=>r.map(f=>`"${f}"`).join(',')).join('\n');
  const blob = new Blob([csvContent],{type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=`patients_export_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

async function exportPDF(){
  if(!checkPermission('export_data')){alert('Unauthorized');return;}
  if(!filteredPatients.length){alert("No data to export");return;}
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF(); const pageWidth=doc.internal.pageSize.getWidth(); const marginX=14; const lineHeight=6;
  doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.text("Patient List Report",pageWidth/2,20,{align:"center"});
  doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.text(`Export Date: ${new Date().toLocaleDateString()}`,pageWidth/2,26,{align:"center"});
  let y=35;
  filteredPatients.forEach(p=>{
    const lines = [`ID: ${normalizeId(p)}`,`Name: ${p.firstName} ${p.lastName}`,`Age/Gender: ${calculateAge(p.dob)} / ${p.gender||"N/A"}`,`Phone: ${p.phone||"N/A"}`,`Address: ${p.address||"N/A"}`,`Diagnosis: ${p.diagnosis||"N/A"}`];
    const blockHeight=lines.length*lineHeight+4; doc.setDrawColor(41,128,185); doc.setFillColor(245,245,245); doc.rect(marginX,y,pageWidth-marginX*2,blockHeight,"FD");
    let yText=y+2; lines.forEach(line=>{doc.text(line,marginX+3,yText);yText+=lineHeight;}); y+=blockHeight+5;
    if(y>280){doc.addPage();y=35;}
  });
  doc.save(`patients_report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// --------------------------
// Navigation
// --------------------------
function handlePrescription(id){window.location.href=`pharmacy.html?patientId=${id}`;}
function handleBilling(id){window.location.href=`invoice.html?patientId=${id}`;}

// --------------------------
// Modal
// --------------------------
function openModal(){document.getElementById('patientModal').style.display='block';}
function closeModal(){document.getElementById('patientModal').style.display='none'; resetForm();}
function resetForm(){
  const modal=document.getElementById('patientModal'); modal.dataset.patientId='';
  document.querySelector('.modal-title').textContent='Add New Patient';
  document.querySelectorAll('.tab-content').forEach(tab=>tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));
  document.getElementById('personal').classList.add('active');
  document.querySelector('[onclick="openTab(event, \'personal\')"]').classList.add('active');
  document.querySelectorAll('#patientModal input,#patientModal select,#patientModal textarea').forEach(f=>f.value='');
}

// Tabs
function openTab(evt,tabName){
  document.querySelectorAll('.tab-content').forEach(tab=>tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.classList.remove('active'));
  document.getElementById(tabName).classList.add('active'); evt.currentTarget.classList.add('active');
}

// --------------------------
// Event listeners
// --------------------------
function setupEventListeners(){
  document.getElementById('search-name')?.addEventListener('input',handleSearch);
  document.getElementById('filter-diagnosis')?.addEventListener('change',handleSearch);
  document.getElementById('filter-status')?.addEventListener('change',handleSearch);
  document.querySelectorAll('.table-sortable th')?.forEach(th=>th.addEventListener('click',()=>handleSort(th.textContent.trim())));
  document.getElementById('export-csv')?.addEventListener('click',exportCSV);
  document.getElementById('export-pdf')?.addEventListener('click',exportPDF);
  document.getElementById('modal-save')?.addEventListener('click',savePatient);
  document.getElementById('modal-close')?.addEventListener('click',closeModal);
  document.querySelectorAll('.tab-btn')?.forEach(btn=>btn.addEventListener('click',evt=>openTab(evt,btn.dataset.tab)));
}

// --------------------------
// RBAC
// --------------------------
function applyRBAC(){
  if(!checkPermission('add_patients')) document.getElementById('add-patient-btn')?.remove();
  if(!checkPermission('export_data')){
    document.getElementById('export-csv')?.remove();
    document.getElementById('export-pdf')?.remove();
  }
}
