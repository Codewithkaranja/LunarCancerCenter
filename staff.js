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
        if (userRole !== "admin") {
          // Hide staff management features for non-admin users
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-delete, .btn-assign")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Show message for non-admin users
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

      // Modal functions
      function openModal() {
        document.getElementById("staffModal").style.display = "flex";
      }

      function closeModal() {
        document.getElementById("staffModal").style.display = "none";
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
        const modal = document.getElementById("staffModal");
        if (event.target === modal) {
          closeModal();
        }
      };