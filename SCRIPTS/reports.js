// Role-Based Access Control Configuration
      const userRoles = {
        admin: {
          reports: { view: true, generate: true, export: true, delete: true },
          dashboard: { view: true },
        },
        doctor: {
          reports: { view: true, generate: false, export: true, delete: false },
          dashboard: { view: true },
        },
        pharmacist: {
          reports: { view: true, generate: false, export: true, delete: false },
          dashboard: { view: true },
        },
        cashier: {
          reports: {
            view: true,
            generate: false,
            export: false,
            delete: false,
          },
          dashboard: { view: true },
        },
      };

      // Current user role (this would typically come from your authentication system)
      let currentUserRole = "admin"; // Default to admin

      // Sample data for reports
      let reportsData = {
        patient: [
          {
            id: 1,
            name: "Monthly Patient Registrations",
            dateRange: "1 Nov - 30 Nov 2025",
            author: "Admin User",
            type: "Patient Demographics",
            generatedAt: "2025-11-30",
          },
          {
            id: 2,
            name: "Cancer Diagnosis Trends",
            dateRange: "1 Oct - 30 Nov 2025",
            author: "Dr. Achieng",
            type: "Medical Analysis",
            generatedAt: "2025-11-28",
          },
          {
            id: 3,
            name: "Treatment Outcomes Report",
            dateRange: "1 Sep - 30 Nov 2025",
            author: "Admin User",
            type: "Patient Progress",
            generatedAt: "2025-11-25",
          },
          {
            id: 4,
            name: "Patient Satisfaction Survey",
            dateRange: "1 Nov - 30 Nov 2025",
            author: "Nurse Jane",
            type: "Feedback Analysis",
            generatedAt: "2025-11-20",
          },
          {
            id: 5,
            name: "Monthly Billing Summary",
            dateRange: "1 Nov - 30 Nov 2025",
            author: "Cashier Mary",
            type: "Financial Report",
            generatedAt: "2025-11-15",
          },
          {
            id: 6,
            name: "Patient Readmission Rates",
            dateRange: "1 Jan - 30 Nov 2025",
            author: "Admin User",
            type: "Quality Metrics",
            generatedAt: "2025-11-10",
          },
          {
            id: 7,
            name: "Oncology Patient Census",
            dateRange: "1 Nov - 30 Nov 2025",
            author: "Dr. Kamau",
            type: "Census Report",
            generatedAt: "2025-11-05",
          },
        ],
        staff: [
          {
            id: 1,
            name: "Staff Performance Review",
            dateRange: "1 Oct - 30 Nov 2025",
            author: "HR Manager",
            type: "Performance",
            generatedAt: "2025-11-29",
          },
          {
            id: 2,
            name: "Staff Attendance Report",
            dateRange: "1 Nov - 30 Nov 2025",
            author: "Admin User",
            type: "Attendance",
            generatedAt: "2025-11-27",
          },
        ],
        appointment: [
          {
            id: 1,
            name: "Appointment No-Shows",
            dateRange: "1 Nov - 30 Nov 2025",
            author: "Admin User",
            type: "Attendance",
            generatedAt: "2025-11-26",
          },
          {
            id: 2,
            name: "Clinic Utilization Report",
            dateRange: "1 Oct - 30 Nov 2025",
            author: "Dr. Achieng",
            type: "Utilization",
            generatedAt: "2025-11-22",
          },
        ],
        inventory: [
          {
            id: 1,
            name: "Medication Stock Levels",
            dateRange: "30 Nov 2025",
            author: "Pharmacist John",
            type: "Inventory",
            generatedAt: "2025-11-30",
          },
          {
            id: 2,
            name: "Medical Supplies Usage",
            dateRange: "1 Oct - 30 Nov 2025",
            author: "Inventory Manager",
            type: "Usage Report",
            generatedAt: "2025-11-24",
          },
        ],
        billing: [
          {
            id: 1,
            name: "Revenue by Department",
            dateRange: "1 Nov - 30 Nov 2025",
            author: "Cashier Mary",
            type: "Financial Report",
            generatedAt: "2025-11-29",
          },
          {
            id: 2,
            name: "Insurance Claims Status",
            dateRange: "1 Oct - 30 Nov 2025",
            author: "Billing Admin",
            type: "Claims Report",
            generatedAt: "2025-11-21",
          },
        ],
        system: [
          {
            id: 1,
            name: "System Access Logs",
            dateRange: "1 Nov - 30 Nov 2025",
            author: "Admin User",
            type: "Security",
            generatedAt: "2025-11-30",
          },
          {
            id: 2,
            name: "Audit Trail Report",
            dateRange: "1 Oct - 30 Nov 2025",
            author: "Admin User",
            type: "Audit",
            generatedAt: "2025-11-23",
          },
        ],
      };

      // Global variables
      let currentCategory = "patient";
      let currentPage = 1;
      const itemsPerPage = 5;
      let currentSort = { field: "generatedAt", direction: "desc" };
      let filteredReports = [...reportsData.patient];

      // DOM elements
      const generateReportBtn = document.getElementById("generate-report-btn");
      const exportDataBtn = document.getElementById("export-data-btn");
      const applyFiltersBtn = document.getElementById("apply-filters-btn");
      const categoryBtns = document.querySelectorAll(".category-btn");
      const reportsTableBody = document.getElementById("reports-table-body");
      const paginationInfo = document.getElementById("pagination-info");
      const paginationControls = document.getElementById("pagination-controls");
      const prevPageBtn = document.getElementById("prev-page");
      const nextPageBtn = document.getElementById("next-page");
      const sortSelect = document.getElementById("sort-reports");
      const generateReportModal = document.getElementById(
        "generate-report-modal"
      );
      const cancelReportBtn = document.getElementById("cancel-report-btn");
      const generateReportModalBtn = document.getElementById(
        "generate-report-modal-btn"
      );
      const reportDateRange = document.getElementById("report-date-range");
      const customDateRange = document.getElementById("custom-date-range");

      // Initialize the application
      function init() {
        renderReportsTable();
        setupEventListeners();
        setupCharts();
        applyRolePermissions();
      }

      // Set up event listeners
      function setupEventListeners() {
        // Category buttons
        categoryBtns.forEach((btn) => {
          btn.addEventListener("click", () => {
            const category = btn.getAttribute("data-category");
            switchCategory(category);
          });
        });

        // Generate report button
        generateReportBtn.addEventListener("click", openGenerateReportModal);

        // Export data button
        exportDataBtn.addEventListener("click", exportData);

        // Apply filters button
        applyFiltersBtn.addEventListener("click", applyFilters);

        // Pagination buttons
        prevPageBtn.addEventListener("click", () =>
          changePage(currentPage - 1)
        );
        nextPageBtn.addEventListener("click", () =>
          changePage(currentPage + 1)
        );

        // Sort select
        sortSelect.addEventListener("change", handleSortChange);

        // Table header sorting
        document
          .querySelectorAll(".reports-table th[data-sort]")
          .forEach((th) => {
            th.addEventListener("click", () => {
              const field = th.getAttribute("data-sort");
              handleHeaderSort(field);
            });
          });

        // Modal buttons
        cancelReportBtn.addEventListener("click", closeGenerateReportModal);
        generateReportModalBtn.addEventListener("click", generateReport);

        // Custom date range toggle
        reportDateRange.addEventListener("change", () => {
          if (reportDateRange.value === "custom") {
            customDateRange.style.display = "block";
          } else {
            customDateRange.style.display = "none";
          }
        });

        // Role switcher for demonstration (remove in production)
        addRoleSwitcher();
      }

      // Setup charts
      function setupCharts() {
        // Patient registrations chart
        const patientCtx = document
          .getElementById("patientChart")
          .getContext("2d");
        new Chart(patientCtx, {
          type: "line",
          data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Patient Registrations",
                data: [12, 19, 15, 17, 22, 18, 14],
                borderColor: "#3498db",
                tension: 0.3,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                display: false,
              },
              x: {
                display: false,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        });

        // Revenue chart
        const revenueCtx = document
          .getElementById("revenueChart")
          .getContext("2d");
        new Chart(revenueCtx, {
          type: "bar",
          data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Revenue (KES)",
                data: [320000, 450000, 380000, 510000, 420000, 350000, 480000],
                backgroundColor: "#2ecc71",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                display: false,
              },
              x: {
                display: false,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        });

        // Appointments chart
        const appointmentCtx = document
          .getElementById("appointmentChart")
          .getContext("2d");
        new Chart(appointmentCtx, {
          type: "line",
          data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Appointments",
                data: [18, 15, 12, 16, 14, 10, 8],
                borderColor: "#f39c12",
                tension: 0.3,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                display: false,
              },
              x: {
                display: false,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        });
      }

      // Switch category
      function switchCategory(category) {
        currentCategory = category;
        currentPage = 1;

        // Update active button
        categoryBtns.forEach((btn) => {
          if (btn.getAttribute("data-category") === category) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });

        // Update reports title
        document.querySelector(".reports-title").textContent = `${
          category.charAt(0).toUpperCase() + category.slice(1)
        } Reports`;

        // Update reports data
        filteredReports = [...reportsData[category]];

        // Apply current sort
        sortReports();

        // Render table
        renderReportsTable();
      }

      // Render reports table
      function renderReportsTable() {
        reportsTableBody.innerHTML = "";

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentItems = filteredReports.slice(startIndex, endIndex);

        currentItems.forEach((report) => {
          const row = document.createElement("tr");

          row.innerHTML = `
            <td>${report.name}</td>
            <td>${report.dateRange}</td>
            <td>${report.author}</td>
            <td>${report.type}</td>
            <td>
              <button class="report-action" onclick="downloadReport(${report.id})">
                <i class="fas fa-download"></i> Download
              </button>
            </td>
          `;

          reportsTableBody.appendChild(row);
        });

        updatePaginationInfo();
      }

      // Update pagination info
      function updatePaginationInfo() {
        const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(
          currentPage * itemsPerPage,
          filteredReports.length
        );

        paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${filteredReports.length} reports`;

        // Update pagination controls
        paginationControls.innerHTML = "";

        // Previous button
        const prevBtn = document.createElement("button");
        prevBtn.className = "pagination-btn";
        prevBtn.id = "prev-page";
        prevBtn.innerHTML = "&laquo; Previous";
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener("click", () => changePage(currentPage - 1));
        paginationControls.appendChild(prevBtn);

        // Page buttons
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
          const pageBtn = document.createElement("button");
          pageBtn.className = "pagination-btn";
          if (i === currentPage) {
            pageBtn.className += " active";
          }
          pageBtn.textContent = i;
          pageBtn.addEventListener("click", () => changePage(i));
          paginationControls.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement("button");
        nextBtn.className = "pagination-btn";
        nextBtn.id = "next-page";
        nextBtn.innerHTML = "Next &raquo;";
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener("click", () => changePage(currentPage + 1));
        paginationControls.appendChild(nextBtn);
      }

      // Change page
      function changePage(page) {
        const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

        if (page < 1 || page > totalPages) return;

        currentPage = page;
        renderReportsTable();
      }

      // Handle sort change
      function handleSortChange() {
        const value = sortSelect.value;

        if (value === "recent") {
          currentSort = { field: "generatedAt", direction: "desc" };
        } else if (value === "name") {
          currentSort = { field: "name", direction: "asc" };
        } else if (value === "type") {
          currentSort = { field: "type", direction: "asc" };
        }

        sortReports();
        renderReportsTable();
      }

      // Handle header sort
      function handleHeaderSort(field) {
        // If already sorting by this field, toggle direction
        if (currentSort.field === field) {
          currentSort.direction =
            currentSort.direction === "asc" ? "desc" : "asc";
        } else {
          // Otherwise, sort by this field ascending
          currentSort = { field, direction: "asc" };
        }

        // Update sort select to match
        if (field === "generatedAt") {
          sortSelect.value = "recent";
        } else if (field === "name") {
          sortSelect.value = "name";
        } else if (field === "type") {
          sortSelect.value = "type";
        }

        sortReports();
        renderReportsTable();
      }

      // Sort reports
      function sortReports() {
        filteredReports.sort((a, b) => {
          let valueA = a[currentSort.field];
          let valueB = b[currentSort.field];

          // Convert to lowercase for case-insensitive string comparison
          if (typeof valueA === "string") valueA = valueA.toLowerCase();
          if (typeof valueB === "string") valueB = valueB.toLowerCase();

          if (valueA < valueB) {
            return currentSort.direction === "asc" ? -1 : 1;
          }
          if (valueA > valueB) {
            return currentSort.direction === "asc" ? 1 : -1;
          }
          return 0;
        });
      }

      // Apply filters
      function applyFilters() {
        const dateRange = document.getElementById("date-range").value;
        const department = document.getElementById("department").value;
        const staffMember = document.getElementById("staff-member").value;

        // In a real app, this would filter the reports based on the selected filters
        // For this demo, we'll just show a message
        alert(`Filters applied: ${dateRange}, ${department}, ${staffMember}`);

        // After applying filters, we would typically fetch filtered data from the backend
        // For now, we'll just use the current data
        renderReportsTable();
      }

      // Open generate report modal
      function openGenerateReportModal() {
        if (!userRoles[currentUserRole].reports.generate) {
          alert("You do not have permission to generate reports.");
          return;
        }

        generateReportModal.style.display = "flex";
      }

      // Close generate report modal
      function closeGenerateReportModal() {
        generateReportModal.style.display = "none";
        document.getElementById("report-form").reset();
        customDateRange.style.display = "none";
      }

      // Generate report
      function generateReport() {
        const reportType = document.getElementById("report-type").value;
        const reportName = document.getElementById("report-name").value;
        const dateRange = document.getElementById("report-date-range").value;
        const format = document.getElementById("report-format").value;

        if (!reportType || !reportName) {
          alert("Please fill in all required fields.");
          return;
        }

        // In a real app, this would send a request to the backend to generate the report
        // For this demo, we'll simulate the process

        // Simulate API call
        setTimeout(() => {
          // Add new report to the list
          const newReport = {
            id: Date.now(),
            name: reportName,
            dateRange: getDateRangeText(dateRange),
            author: "Admin User",
            type:
              reportType.charAt(0).toUpperCase() +
              reportType.slice(1) +
              " Report",
            generatedAt: new Date().toISOString().split("T")[0],
          };

          reportsData[reportType].unshift(newReport);

          // Switch to the appropriate category
          switchCategory(reportType);

          // Close modal
          closeGenerateReportModal();

          alert(
            `Report generated successfully in ${format.toUpperCase()} format!`
          );
        }, 1500);
      }

      // Get date range text for display
      function getDateRangeText(dateRangeValue) {
        const today = new Date();

        switch (dateRangeValue) {
          case "today":
            return today.toLocaleDateString("en-GB");
          case "week":
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            return `${weekAgo.toLocaleDateString(
              "en-GB"
            )} - ${today.toLocaleDateString("en-GB")}`;
          case "month":
            const monthAgo = new Date();
            monthAgo.setMonth(today.getMonth() - 1);
            return `${monthAgo.toLocaleDateString(
              "en-GB"
            )} - ${today.toLocaleDateString("en-GB")}`;
          case "quarter":
            const quarterAgo = new Date();
            quarterAgo.setMonth(today.getMonth() - 3);
            return `${quarterAgo.toLocaleDateString(
              "en-GB"
            )} - ${today.toLocaleDateString("en-GB")}`;
          case "year":
            const yearAgo = new Date();
            yearAgo.setFullYear(today.getFullYear() - 1);
            return `${yearAgo.toLocaleDateString(
              "en-GB"
            )} - ${today.toLocaleDateString("en-GB")}`;
          case "custom":
            const startDate = document.getElementById("start-date").value;
            const endDate = document.getElementById("end-date").value;
            if (startDate && endDate) {
              return `${new Date(startDate).toLocaleDateString(
                "en-GB"
              )} - ${new Date(endDate).toLocaleDateString("en-GB")}`;
            }
            return "Custom Range";
          default:
            return "N/A";
        }
      }

      // Export data
      function exportData() {
        if (!userRoles[currentUserRole].reports.export) {
          alert("You do not have permission to export data.");
          return;
        }

        // In a real app, this would export the data in the selected format
        // For this demo, we'll simulate the process

        // Get current filters
        const dateRange = document.getElementById("date-range").value;
        const department = document.getElementById("department").value;

        alert(
          `Exporting ${currentCategory} data for ${dateRange}${
            department ? ` in ${department}` : ""
          }...`
        );

        // Simulate export process
        setTimeout(() => {
          // Create a dummy download link
          const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(filteredReports));
          const downloadAnchorNode = document.createElement("a");
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute(
            "download",
            `${currentCategory}_reports_${new Date()
              .toISOString()
              .slice(0, 10)}.json`
          );
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
        }, 1000);
      }

      // Download report
      function downloadReport(id) {
        const report = filteredReports.find((r) => r.id === id);
        if (!report) return;

        // In a real app, this would download the actual report file
        // For this demo, we'll simulate the download

        alert(`Downloading report: ${report.name}`);

        // Simulate download process
        setTimeout(() => {
          // Create a dummy text file for download
          const content = `Report: ${report.name}\nDate Range: ${report.dateRange}\nGenerated By: ${report.author}\nType: ${report.type}\n\nThis is a demo report. In a real system, this would contain actual report data.`;
          const dataStr =
            "data:text/plain;charset=utf-8," + encodeURIComponent(content);
          const downloadAnchorNode = document.createElement("a");
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute(
            "download",
            `${report.name.replace(/\s+/g, "_")}.txt`
          );
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
        }, 500);
      }

      // Apply role permissions
      function applyRolePermissions() {
        const permissions = userRoles[currentUserRole];

        // Show/hide buttons based on permissions
        generateReportBtn.style.display = permissions.reports.generate
          ? "flex"
          : "none";
        exportDataBtn.style.display = permissions.reports.export
          ? "flex"
          : "none";

        // Update user info based on role
        const userInfo = document.querySelector(".user-details h3");
        if (userInfo) {
          userInfo.textContent = `${
            currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1)
          } User`;
        }
      }

      // Add role switcher for demonstration (remove in production)
      function addRoleSwitcher() {
        const headerActions = document.querySelector(".header-actions");
        if (!headerActions) return;

        const roleSwitcher = document.createElement("select");
        roleSwitcher.id = "role-switcher";
        roleSwitcher.innerHTML = `
          <option value="admin" selected>Admin</option>
          <option value="doctor">Doctor</option>
          <option value="pharmacist">Pharmacist</option>
          <option value="cashier">Cashier</option>
        `;
        roleSwitcher.value = currentUserRole;
        roleSwitcher.style.marginRight = "10px";
        roleSwitcher.onchange = function () {
          currentUserRole = this.value;
          applyRolePermissions();
        };

        headerActions.insertBefore(roleSwitcher, headerActions.firstChild);
      }

      // Logout function
      function logout() {
        if (confirm("Are you sure you want to logout?")) {
          alert("Logging out...");
          // In a real application, this would redirect to the login page
           window.location.href = 'index.html';
        }
      }

      // Initialize the application when the DOM is loaded
      document.addEventListener("DOMContentLoaded", init);