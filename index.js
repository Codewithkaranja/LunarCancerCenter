 // Role selection functionality
      const roleButtons = document.querySelectorAll(".role-btn");
      let selectedRole = "doctor";
      let selectedRoleName = "Dr. Achieng";

      roleButtons.forEach((button) => {
        button.addEventListener("click", () => {
          roleButtons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");
          selectedRole = button.getAttribute("data-role");

          // Update username based on selected role
          const usernameField = document.getElementById("username");
          switch (selectedRole) {
            case "admin":
              usernameField.value = "admin";
              selectedRoleName = "Administrator";
              break;
            case "doctor":
              usernameField.value = "doctor.achieng";
              selectedRoleName = "Dr. Achieng";
              break;
            case "nurse":
              usernameField.value = "nurse.jane";
              selectedRoleName = "Nurse Jane";
              break;
            case "pharmacist":
              usernameField.value = "pharmacist.john";
              selectedRoleName = "Pharmacist John";
              break;
            case "cashier":
              usernameField.value = "cashier.mary";
              selectedRoleName = "Cashier Mary";
              break;
          }
        });
      });

      // Function to select demo account
      function selectDemo(role, name) {
        const roleButton = document.querySelector(
          `.role-btn[data-role="${role}"]`
        );
        if (roleButton) {
          roleButtons.forEach((btn) => btn.classList.remove("active"));
          roleButton.classList.add("active");
          selectedRole = role;
          selectedRoleName = name;

          // Update username based on selected role
          const usernameField = document.getElementById("username");
          switch (role) {
            case "admin":
              usernameField.value = "admin";
              break;
            case "doctor":
              usernameField.value = "doctor.achieng";
              break;
            case "nurse":
              usernameField.value = "nurse.jane";
              break;
            case "pharmacist":
              usernameField.value = "pharmacist.john";
              break;
            case "cashier":
              usernameField.value = "cashier.mary";
              break;
          }
        }
      }

      // Login function
      function login() {
        // Store the selected role in localStorage to use in the dashboard
        localStorage.setItem("userRole", selectedRole);
        localStorage.setItem("userName", selectedRoleName);

        // Redirect to dashboard
        window.location.href = "dashboard.html";
      }

      // Check if we're coming from a logout and clear stored data
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("logout")) {
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
      }

      // Check if user data is already stored and pre-select the role
      document.addEventListener("DOMContentLoaded", () => {
        const storedRole = localStorage.getItem("userRole");
        const storedName = localStorage.getItem("userName");

        if (storedRole && storedName) {
          const roleButton = document.querySelector(
            `.role-btn[data-role="${storedRole}"]`
          );
          if (roleButton) {
            roleButtons.forEach((btn) => btn.classList.remove("active"));
            roleButton.classList.add("active");
            selectedRole = storedRole;
            selectedRoleName = storedName;

            // Update username based on stored role
            const usernameField = document.getElementById("username");
            switch (storedRole) {
              case "admin":
                usernameField.value = "admin";
                break;
              case "doctor":
                usernameField.value = "doctor.achieng";
                break;
              case "nurse":
                usernameField.value = "nurse.jane";
                break;
              case "pharmacist":
                usernameField.value = "pharmacist.john";
                break;
              case "cashier":
                usernameField.value = "cashier.mary";
                break;
            }
          }
        }
      });