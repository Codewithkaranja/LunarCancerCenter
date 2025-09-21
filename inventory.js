// Simple functionality for demonstration
      document.addEventListener("DOMContentLoaded", function () {
        // Get user role from localStorage (set during login)
        const userRole = localStorage.getItem("userRole") || "pharmacist";
        const userName = localStorage.getItem("userName") || "Pharmacist John";

        // Update user info in header
        document.querySelector(".user-details h3").textContent = userName;
        document.querySelector(".user-details p").textContent =
          userRole.charAt(0).toUpperCase() + userRole.slice(1);

        // Adjust UI based on user role
        if (userRole === "doctor") {
          // Doctors can only view inventory
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-delete, .btn-restock")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Show message for view-only users
          const pageTitle = document.querySelector(".page-title");
          pageTitle.innerHTML += " <small>(View Only)</small>";
        } else if (userRole === "nurse") {
          // Nurses can request items but not edit inventory
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-delete, .btn-restock")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Add request button for nurses
          const actionCells = document.querySelectorAll(".action-cell");
          actionCells.forEach((cell) => {
            const requestBtn = document.createElement("button");
            requestBtn.className = "action-btn btn-view";
            requestBtn.innerHTML =
              '<i class="fas fa-clipboard-list"></i> Request';
            cell.appendChild(requestBtn);
          });

          // Show message for nurses
          const pageTitle = document.querySelector(".page-title");
          pageTitle.innerHTML += " <small>(Request Only)</small>";
        } else if (userRole === "cashier") {
          // Cashiers can only view inventory
          document.querySelector(".btn-primary").style.display = "none";
          document
            .querySelectorAll(".btn-edit, .btn-delete, .btn-restock")
            .forEach((btn) => {
              btn.style.display = "none";
            });

          // Show message for view-only users
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
        document.getElementById("inventoryModal").style.display = "flex";
      }

      function closeModal() {
        document.getElementById("inventoryModal").style.display = "none";
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
        const modal = document.getElementById("inventoryModal");
        if (event.target === modal) {
          closeModal();
        }
      };