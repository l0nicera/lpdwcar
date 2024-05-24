import {displayRouteOnMap, initSessionDetails, loadGoogleMapsApi} from "./locationServices.js";
import {calculateDuration, formatDate, formatDistance, formatDuration, translateToStoredLocal} from "./utils.js";
import {getSession} from "./apiRoutes.js";
import {Session} from "./apiTypes.js";

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runInit);
} else {
  await runInit();
}

async function runInit() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = parseInt(urlParams.get("id"));
    const routeMap = document.getElementById("routeMap");
    let session = null;

    if (sessionId) {
      const response = await getSession(sessionId);
      if (response.status !== "success") {
        throw new Error(`Failed to fetch session details: ${response.message}`);
      }
      if (!response.data) {
        throw new Error(`No session data found for session: ID ${sessionId}`);
      }
      session = new Session(response.data);
      const librariesDataEntry = ["places", "geometry"];
      loadGoogleMapsApi(initSessionDetails, librariesDataEntry)
          .then(() => {
            console.log("Google Maps API loaded and initialized for SessionDetails page");
            if (session) {
              displaySessionDetails(session);
              if (session.gps_points || (session.start_coords && session.stop_coords)) {
                displayRouteOnMap(session);
                routeMap.removeAttribute("hidden");
              }
            }
          })
          .catch((error) => {
            throw new Error(error.message);
          });
    }
  } catch (error) {
    throw new Error(error.message);
  }
}


async function displaySessionDetails(session) {
  try {
    const headerSubtitleElement = document.querySelector("header hgroup p");
    const formattedStartDate = formatDate(session.start_datetime);
    headerSubtitleElement.textContent = `Détails de la session du ${formattedStartDate}`;

    const detailsContainer = document.getElementById("sessionDetails");
    const duration = calculateDuration(session.start_datetime, session.stop_datetime);
    addDetail(detailsContainer, "Durée", formatDuration(duration));
    addDetail(detailsContainer, "Distance parcourue", formatDistance(session.travel_distance));

    const conditionsDetails = document.getElementById("conditionsDetails");

    await translateAndAddDetails(session);

    const editSessionLink = document.getElementById("editSessionLink");
    editSessionLink.setAttribute("href", `DataEntry.html?id=${session.id}`);
    const addInfosLink = document.getElementById("addInfosLink");
    addInfosLink.setAttribute("href", `DataEntry.html?id=${session.id}`);
  } catch (error) {
    throw new Error('Error displaying session details: ' + error.message)
  }
}

async function translateAndAddDetails(session) {
  try {
    const conditionsDetails = document.getElementById("conditionsDetails");

    if (session.nighttime) {
      addDetail(conditionsDetails, await translateToStoredLocal("nighttime"));
    }

    if (session.weather) {
      addDetail(conditionsDetails, await translateToStoredLocal(session.weather.name));
    }

    if (session.hazards) {
      for (const hazard of session.hazards) {
        addDetail(conditionsDetails, await translateToStoredLocal(hazard.name));
      }
    }

    if (session.roadtypes) {
      for (const roadtype of session.roadtypes) {
        addDetail(conditionsDetails, await translateToStoredLocal(roadtype.name));
      }
    }

    if (session.parkings) {
      for (const parking of session.parkings) {
        addDetail(conditionsDetails, await translateToStoredLocal(parking.name));
      }
    }

    if (session.maneuvers) {
      for (const maneuver of session.maneuvers) {
        addDetail(conditionsDetails, await translateToStoredLocal(maneuver.name));
      }
    }
  } catch (error) {
    throw new Error('Error translating and adding details: ' + error.message);
  }
}

function addDetail(container, label, value = "") {
  const detail = document.createElement("p");
  if (value !== "") {
    detail.innerHTML = `<strong>${label}:</strong> ${value}`;
  } else {
    detail.innerHTML = `<strong>${label}</strong>`;
  }
  container.appendChild(detail);
}
