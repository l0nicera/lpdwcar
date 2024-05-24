import { deleteSession, getSessions } from "./apiRoutes.js";
import { translateToStoredLocal } from "./utils.js";
import {showError} from "./uiComponents.js";

document.addEventListener('DOMContentLoaded', runInit);
document.readyState !== 'loading' && runInit();

async function runInit() {
  try {
    const response = await getSessions();
    if (response.status !== "success") {
      throw new Error(`Failed to fetch sessions: ${response.message}`);
    }
    const sessions = response.data ?? [];
    if (sessions.length === 0) {
      console.warn("No sessions data found.");
      return;
    }
    await displaySessions(sessions);
  } catch (error) {
    showError("Error fetching sessions: " + error.message);
  }
}

function clearTable(tableBody) {
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
}

async function displaySessions(sessions) {
  try {
    const tableBody = document.querySelector("#sessionsTable tbody");
    clearTable(tableBody);
    for (const session of sessions) {
      await createSessionRow(session, tableBody);
    }
    tableBody.addEventListener('click', handleTableClick);
  } catch (error) {
    throw new Error("Error displaying sessions: " + error.message);
  }
}

async function createSessionRow(session, tableBody) {
  try {
    const row = document.createElement('tr');
    row.dataset.sessionId = session.id;
    row.innerHTML = await generateRowHTML(session);
    tableBody.appendChild(row);
  } catch (error) {
    throw new Error("Error creating session row: " + error.message);
  }
}

async function generateRowHTML(session) {
  try {
    const start = new Date(session.start_datetime);
    const stop = new Date(session.stop_datetime);
    const durationInSeconds = (stop - start) / 1000;

    let durationDisplay;
    if (durationInSeconds < 60) {
      durationDisplay = `${durationInSeconds} ${durationInSeconds === 1 ? 'seconde' : 'secondes'}`;
    } else if (durationInSeconds < 3600) {
      const minutes = Math.floor(durationInSeconds / 60);
      durationDisplay = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else {
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      durationDisplay = `${hours} ${hours === 1 ? 'heure' : 'heures'}${minutes > 0 ? ` et ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''}`;
    }

    const conditions = await prepareConditions(session);

    return `
      <td>${start.toLocaleDateString()}</td>
      <td>${start.toLocaleTimeString()}</td>
      <td>${stop.toLocaleTimeString()}</td>
      <td>${durationDisplay}</td>
      <td>${session.travel_distance} km</td>
      ${conditions.map(condition => condition ? `<td>${condition}</td>` : `<td></td>`).join('')}
      <td>
          <a href="#" class="edit-session-link" data-session-id="${session.id}">Modifier</a>
          <a href="#" class="delete-session-link" data-session-id="${session.id}">Supprimer</a>
      </td>
    `;
  } catch (error) {
    throw new Error("Error generating row HTML:" + error.message);
  }
}

async function prepareConditions(session) {
  try {
    const conditions = [
      session.nighttime ? 'Oui' : '',
      session.weather ? await translateToStoredLocal(session.weather.name) : ''
    ];

    const translationsPromises = [session.hazards, session.maneuvers, session.parkings, session.roadtypes].map(async array => {
      if (array.length > 0) {
        const translationPromises = array.map(item => translateToStoredLocal(item.name));
        const translations = await Promise.all(translationPromises);
        return translations.join(' ') || '';
      }
      return '';
    });

    const additionalConditions = await Promise.all(translationsPromises);
    return conditions.concat(additionalConditions);
  } catch (error) {
    throw new Error("Error preparing conditions: " + error.message);
  }
}


async function handleTableClick(event) {
  try {
    const target = event.target;
    const sessionId = parseInt(target.dataset.sessionId);
    if (target.classList.contains('delete-session-link') && confirm("Êtes-vous sûr de vouloir supprimer cette session ?")) {
      event.preventDefault();
      await deleteSessionAndRefresh(sessionId);
    } else if (target.classList.contains('edit-session-link')) {
      event.preventDefault();
      window.location.href = `DataEntry.html?id=${sessionId}`;
    }
  } catch (error) {
    throw new Error("Error handling table click: " + error.message);
  }
}

async function deleteSessionAndRefresh(sessionId) {
  try {
    const deleteSuccess = await deleteSession(sessionId);
    if (!deleteSuccess) {
      throw new Error(`Failed to delete session with ID: ${sessionId}`);
    }
    await runInit();
  } catch (error) {
    throw new Error(`Error deleting session with ID: ${sessionId}` + error.message);
  }
}
