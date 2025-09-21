document.addEventListener("DOMContentLoaded", function () {
        // Patient Visits Chart
        const visitsCtx = document
          .getElementById("patientVisitsChart")
          .getContext("2d");
        const visitsChart = new Chart(visitsCtx, {
          type: "line",
          data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Patient Visits",
                data: [18, 25, 22, 30, 27, 15, 10],
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

        // Diagnosis Chart
        const diagnosisCtx = document
          .getElementById("diagnosisChart")
          .getContext("2d");
        const diagnosisChart = new Chart(diagnosisCtx, {
          type: "doughnut",
          data: {
            labels: [
              "Breast Cancer",
              "Lung Cancer",
              "Prostate Cancer",
              "Colorectal",
              "Other",
            ],
            datasets: [
              {
                data: [35, 25, 15, 12, 13],
                backgroundColor: [
                  "#3498db",
                  "#2ecc71",
                  "#9b59b6",
                  "#e74c3c",
                  "#f39c12",
                ],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
              },
            },
          },
        });

        // Role switching simulation (for demo purposes)
        const userRole = "doctor"; // Change to 'admin', 'nurse', 'pharmacist', or 'cashier' to see different views

        // In a real application, this would be based on actual user data
        console.log(`Current user role: ${userRole}`);
      });