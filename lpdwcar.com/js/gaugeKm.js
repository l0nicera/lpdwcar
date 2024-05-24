import { getTotalTravelDistance } from "./apiRoutes.js";

window.progressChartInstance = window.progressChartInstance || null;

export async function initGauge() {
  if (window.progressChartInstance !== null) {
    console.log("Destroying existing chart instance.");
    window.progressChartInstance.destroy();
    window.progressChartInstance = null;
  }

  const response = await getTotalTravelDistance();
  if (response.status !== "success") {
    console.error("Failed to fetch total distance:", response.message);
    return;
  }
  const totalDistance = parseInt(response.data);

  let difference = 3000 - totalDistance;
  let decompte = Math.max(difference, 0);

  let canvas = document.getElementById("progressChart");
  let ctx = canvas.getContext("2d");

  window.progressChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [totalDistance, decompte],
        backgroundColor: ["#36A2EB", "#fcf6bd"],
        borderWidth: 0,
        circumference: 270,
        rotation: -135,
        cutout: "80%",
      }],
    },
    options: {
      layout: { padding: 0, margin: 0 },
      events: [],
    },
  });

  console.log("New chart instance created.");

  const totalDistanceCovered = document.getElementById("totalDistanceCovered");
  totalDistanceCovered.textContent = `${totalDistance} / 3000 km`;
  totalDistanceCovered.removeAttribute('hidden');
}
