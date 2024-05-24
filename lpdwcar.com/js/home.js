import { loadGoogleMapsApi, initHomeMaps } from "./locationServices.js";
import { initGauge } from "./gaugeKm.js";
import {sessionManager} from "./sessionManager.js";
import {Session} from "./apiTypes.js";
import {getFromStorage, removeFromStorage} from "./localstorageManager.js";
import {showError} from "./uiComponents.js";

export async function initHome() {
  const librariesHome = ["geometry"];
  try {
    await loadGoogleMapsApi(initHomeMaps, librariesHome);
    if (!window.homeHandlersSetup) {
      await setupHomeHandlers();
      window.homeHandlersSetup = true;
    }
    await initGauge();
  } catch (error) {
    console.error(error);
    showError('An error occurred while initializing application: ' + error.message);
  }
}

async function setupHomeHandlers() {
  const sessionControlBtn = document.getElementById("sessionControlBtn");
  const chartContainer = document.getElementById("chartContainer");
  const homePageModal = document.getElementById("homePageModal");
  const sessionDetailsLink = document.getElementById("sessionDetailsLink");
  const dataEntryLink = document.getElementById("dataEntryLink");
  const sessionInfo = document.getElementById("sessionInfo");
  const closeModal = document.getElementsByClassName("close")[0];
  sessionControlBtn.addEventListener("click", await toggleSessionState);

  closeModal.onclick = () => {
    homePageModal.style.display = "none";
  };

  window.onclick = (e) => {
    if (e.target === homePageModal) {
      homePageModal.style.display = "none";
    }
  };

  async function toggleSessionState() {
    try {
      if (sessionControlBtn.classList.contains("start")) {
        await sessionManager.startSession();
        sessionControlBtn.classList.remove("start");
        sessionControlBtn.classList.add("stop");
        sessionControlBtn.textContent = "Stop";
        chartContainer.style.display = "none";
      } else {
        await sessionManager.stopSession();
        stopSessionUpdate();
        removeFromStorage('currentSession');
      }
    } catch (error) {
      showError('An error occurred while toggling the session state. ' + error.message);
      sessionControlBtn.classList.remove("stop");
      sessionControlBtn.classList.add("start");
      sessionControlBtn.textContent = "Start";
      chartContainer.style.display = "block";
    }
  }

  function stopSessionUpdate() {
    sessionControlBtn.classList.remove("stop");
    sessionControlBtn.classList.add("start");
    sessionControlBtn.textContent = "Start";
    chartContainer.style.display = "block";
    homePageModal.style.display = "block";

    try {
      const session = new Session(getFromStorage('currentSession'));
      sessionDetailsLink.setAttribute("href", `./pages/SessionDetails.html?id=${session.id}`);

      const startDateTime = new Date(session.start_datetime);
      const stopDateTime = new Date(session.stop_datetime);

      const startDateToString = startDateTime.toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
      }) + ' ' + startDateTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit'
      });

      const stopDateToString = stopDateTime.toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
      }) + ' ' + stopDateTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit'
      });

      sessionInfo.innerHTML = `Date de début&nbsp;: ${startDateToString}<br>
                               Date de fin&nbsp;: ${stopDateToString}<br>
                               Distance parcourue&nbsp;: ${session.travel_distance} km`;

      dataEntryLink.setAttribute("href", `./pages/DataEntry.html?id=${session.id}&source=homePage`);
    } catch (error) {
      throw new Error('An error occurred while updating the session info. ' + error.message);
    }
  }
}