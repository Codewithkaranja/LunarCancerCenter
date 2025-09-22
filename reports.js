// Simple functionality for demonstration
      document.addEventListener("DOMContentLoaded", function () {
        // Get user role from localStorage (set during login)
        const userRole = localStorage.getItem("userRole") || "admin";
        const userName = localStorage.getItem("userName") || "Admin User";

        // Update user info in header
        document.querySelector(".user-details h3").textContent = userName;
        document.querySelector(".user-details p").textContent =
          userRole.charAt(0).toUpperCase() + userRole.slice(1);

        // Adjust UI based on user role
        if (userRole === "doctor") {
          // Doctors can only view patient and appointment reports
          document.querySelectorAll(".category-btn").forEach((btn, index) => {
            if (index > 1) btn.style.display = "none";
          });
        } else if (userRole === "nurse") {
          // Nurses can only view patient reports
          document.querySelectorAll(".category-btn").forEach((btn, index) => {
            if (index > 0) btn.style.display = "none";
          });
        } else if (userRole === "pharmacist") {
          // Pharmacists can only view inventory reports
          document.querySelectorAll(".category-btn").forEach((btn, index) => {
            if (index !== 3) btn.style.display = "none";
          });
        } else if (userRole === "cashier") {
          // Cashiers can only view billing reports
          document.querySelectorAll(".category-btn").forEach((btn, index) => {
            if (index !== 4) btn.style.display = "none";
          });
        }

        // Initialize charts
        initCharts();
      });

      // Initialize charts
      function initCharts() {
        // Patient Registrations Chart
        const patientCtx = document
          .getElementById("patientChart")
          .getContext("2d");
        const patientChart = new Chart(patientCtx, {
          type: "line",
          data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Patient Registrations",
                data: [12, 19, 15, 22, 18, 14, 8],
                borderColor: "#3498db",
                backgroundColor: "rgba(52, 152, 219, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  drawBorder: false,
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
          },
        });

        // Revenue Chart
        const revenueCtx = document
          .getElementById("revenueChart")
          .getContext("2d");
        const revenueChart = new Chart(revenueCtx, {
          type: "bar",
          data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Revenue (KES)",
                data: [320000, 450000, 380000, 510000, 420000, 280000, 180000],
                backgroundColor: "rgba(46, 204, 113, 0.7)",
                borderColor: "#2ecc71",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  drawBorder: false,
                },
                ticks: {
                  callback: function (value) {
                    return "KES " + value / 1000 + "K";
                  },
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
          },
        });

        // Appointment Chart
        const appointmentCtx = document
          .getElementById("appointmentChart")
          .getContext("2d");
        const appointmentChart = new Chart(appointmentCtx, {
          type: "line",
          data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Appointments",
                data: [18, 22, 16, 20, 15, 8, 4],
                borderColor: "#f39c12",
                backgroundColor: "rgba(243, 156, 18, 0.1)",
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  drawBorder: false,
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
          },
        });
      }

      // Logout function
      function logout() {
        // Clear user data from localStorage
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");

        // Redirect to login page
        window.location.href = "index.html";
      }

      // Category buttons functionality
      const categoryButtons = document.querySelectorAll(".category-btn");
      categoryButtons.forEach((button) => {
        button.addEventListener("click", () => {
          categoryButtons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");

          // In a real application, this would load the appropriate report category
          const reportsTitle = document.querySelector(".reports-title");
          reportsTitle.textContent = button.textContent;
        });
      });