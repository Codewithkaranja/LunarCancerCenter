 // Simple functionality for demonstration
      document.addEventListener("DOMContentLoaded", function () {
        // Get user role from localStorage (set during login)
        const userRole = localStorage.getItem("userRole") || "doctor";
        const userName = localStorage.getItem("userName") || "Dr. Achieng";

        // Update user info in header
        document.querySelector(".user-details h3").textContent = userName;
        document.querySelector(".user-details p").textContent =
          userRole.charAt(0).toUpperCase() + userRole.slice(1);

        // Adjust UI based on user role
        if (userRole === "nurse") {
          // Nurses can view and update appointments but not create them
          document.querySelector(".btn-primary").style.display = "none";
        } else if (userRole === "pharmacist" || userRole === "cashier") {
          // Pharmacists and cashiers have limited access
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-cancel, .btn-reschedule")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Show message for limited access users
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

      // View toggle function
      function toggleView(viewType) {
        const listView = document.getElementById("listView");
        const calendarView = document.getElementById("calendarView");
        const listViewBtn = document.getElementById("listViewBtn");
        const calendarViewBtn = document.getElementById("calendarViewBtn");

        if (viewType === "list") {
          listView.style.display = "block";
          calendarView.style.display = "none";
          listViewBtn.classList.add("active");
          calendarViewBtn.classList.remove("active");
        } else {
          listView.style.display = "none";
          calendarView.style.display = "block";
          listViewBtn.classList.remove("active");
          calendarViewBtn.classList.add("active");
        }
      }

      // Modal functions
      function openModal() {
        document.getElementById("appointmentModal").style.display = "flex";
      }

      function closeModal() {
        document.getElementById("appointmentModal").style.display = "none";
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
        const modal = document.getElementById("appointmentModal");
        if (event.target === modal) {
          closeModal();
        }
      };