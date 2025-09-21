// Simple functionality for demonstration
      document.addEventListener("DOMContentLoaded", function () {
        // Get user role from localStorage (set during login)
        const userRole = localStorage.getItem("userRole") || "cashier";
        const userName = localStorage.getItem("userName") || "Cashier Mary";

        // Update user info in header
        document.querySelector(".user-details h3").textContent = userName;
        document.querySelector(".user-details p").textContent =
          userRole.charAt(0).toUpperCase() +
          userRole.slice(1) +
          " / Finance Staff";

        // Payment action buttons
        const actionCards = document.querySelectorAll(".action-card");
        actionCards.forEach((card) => {
          card.addEventListener("click", function () {
            const action = this.querySelector("h3").textContent;
            alert(`Action: ${action} would be performed here.`);
          });
        });

        // Export buttons
        const exportButtons = document.querySelectorAll(".page-actions .btn");
        exportButtons.forEach((button) => {
          button.addEventListener("click", function () {
            const action = this.textContent.trim();
            alert(`Action: ${action} would be performed here.`);
          });
        });

        // Print and download buttons
        const invoiceButtons = document.querySelectorAll(
          ".invoice-actions .btn"
        );
        invoiceButtons.forEach((button) => {
          button.addEventListener("click", function () {
            const action = this.textContent.trim();
            alert(`Action: ${action} would be performed here.`);
          });
        });
      });