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
          // Hide settings for non-admin users
          document
            .querySelectorAll(".settings-section, .settings-nav")
            .forEach((el) => {
              el.style.display = "none";
            });

          // Show message for non-admin users
          const pageTitle = document.querySelector(".page-title");
          pageTitle.innerHTML = "Access Denied <small>(Admin only)</small>";

          const message = document.createElement("div");
          message.style.background = "white";
          message.style.padding = "20px";
          message.style.borderRadius = "8px";
          message.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05)";
          message.style.textAlign = "center";
          message.innerHTML = `
                    <i class="fas fa-lock" style="font-size: 3rem; color: var(--accent); margin-bottom: 15px;"></i>
                    <h2 style="margin-bottom: 10px;">Settings Access Restricted</h2>
                    <p>Only administrators can access system settings. Please contact your system administrator if you need to make changes.</p>
                `;

          document.querySelector(".settings-content").appendChild(message);
        }

        // Navigation buttons functionality
        const navButtons = document.querySelectorAll(".nav-btn");
        navButtons.forEach((button) => {
          button.addEventListener("click", () => {
            navButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");

            // In a real application, this would show the appropriate section
            const sectionTitle = document.querySelector(".section-title");
            sectionTitle.textContent = button.textContent;
          });
        });
      });

      // Logout function
      function logout() {
        // Clear user data from localStorage
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");

        // Redirect to login page
        window.location.href = "index.html";
      }