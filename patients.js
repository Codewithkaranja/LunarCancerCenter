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
        if (
          userRole === "nurse" ||
          userRole === "pharmacist" ||
          userRole === "cashier"
        ) {
          // Hide delete buttons for certain roles
          document.querySelectorAll(".btn-delete").forEach((btn) => {
            btn.style.display = "none";
          });

          // Hide add patient button for certain roles
          if (userRole === "pharmacist" || userRole === "cashier") {
            document.querySelector(".btn-primary").style.display = "none";
          }
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
        document.getElementById("patientModal").style.display = "flex";
      }

      function closeModal() {
        document.getElementById("patientModal").style.display = "none";
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
        const modal = document.getElementById("patientModal");
        if (event.target === modal) {
          closeModal();
        }
      };