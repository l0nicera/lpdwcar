import { getConditions, getSessions } from "./apiRoutes.js";
import {translateToStoredLocal} from "./utils.js";
import {showError} from "./uiComponents.js";

function calculateStats(sessions) {
  const distances = sessions.map(s => parseInt(s.travel_distance, 10));
  const totalDistance = distances.reduce((sum, d) => sum + (isNaN(d) ? 0 : d), 0);
  const durations = sessions.map(s => {
    const start = new Date(s.start_datetime);
    const end = new Date(s.stop_datetime);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) ? end - start : NaN;
  }).filter(d => !isNaN(d));
  const nighttimeCount = sessions.reduce((count, session) => count + (session.nighttime ? 1 : 0), 0);

  return {
    totalSessions: sessions.length,
    totalDistance,
    longestDistance: Math.max(...distances),
    shortestDistance: Math.min(...distances),
    averageDistance: totalDistance / sessions.length,
    totalDuration: durations.reduce((sum, d) => sum + d, 0) / (1000 * 60 * 60),
    longestDuration: Math.max(...durations) / (1000 * 60 * 60),
    shortestDuration: Math.min(...durations) / (1000 * 60 * 60),
    averageDuration: (durations.reduce((sum, d) => sum + d, 0) / durations.length) / (1000 * 60 * 60),
    nighttimePercentage: ((nighttimeCount / sessions.length) * 100).toFixed(2)
  };
}

function calculateConditionPercentages(sessions, conditions, key) {
  const counts = sessions.reduce((acc, session) => {
    let conditionItems = session[key];

    if (!Array.isArray(conditionItems)) {
      conditionItems = conditionItems ? [conditionItems] : [];
    }

    conditionItems.forEach(item => {
      const id = item.id ? item.id : item;
      acc[id] = (acc[id] || 0) + 1;
    });

    return acc;
  }, {});

  return conditions.map(condition => ({
    name: condition.name,
    percentage: ((counts[condition.id] || 0) / sessions.length * 100).toFixed(2)
  }));
}


function toCamelCase(str) {
  return str.replace(/[-\s]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '').replace(/^\w/, chr => chr.toLowerCase());
}

function updateStatsDisplay(stats) {
  stats.forEach(stat => {
    const elementId = `${toCamelCase(stat.name)}Stat`;
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = `${stat.percentage} %`;
    } else {
      console.warn(`Element with id ${elementId} not found`);
    }
  });
}

async function createConditionsDOM(data) {
  const container = document.getElementById('conditionData');

  async function appendSection(categoryName, items) {
    const mainContainer = document.createElement('div');
    mainContainer.id = `${categoryName}Container`;

    const title = document.createElement('h4');
    title.textContent = await translateToStoredLocal(categoryName);
    mainContainer.appendChild(title);

    const dataContainer = document.createElement('div');
    dataContainer.className = 'data-container';

    for (const item of items) {
      const dataItem = document.createElement('div');
      dataItem.className = 'data-item';

      const label = document.createElement('p');
      label.id = `${toCamelCase(item.name)}Label`;
      label.textContent = await translateToStoredLocal(item.name);

      const stat = document.createElement('p');
      stat.id = `${toCamelCase(item.name)}Stat`;
      stat.textContent = '%';

      dataItem.appendChild(label);
      dataItem.appendChild(stat);
      dataContainer.appendChild(dataItem);
    }

    mainContainer.appendChild(dataContainer);
    container.appendChild(mainContainer);
  }

  for (const category of Object.keys(data)) {
    await appendSection(category, data[category]);
  }
}



async function init() {
  try {
    const sessionResponse = await getSessions();
    const conditionResponse = await getConditions();

    const sessions = sessionResponse.data;
    const conditions = conditionResponse.data;
    const stats = calculateStats(sessions);

    document.getElementById("totalSessionStat").textContent = stats.totalSessions;
    document.getElementById("totalDistanceStat").textContent = stats.totalDistance + ' km';
    document.getElementById("maxDistanceStat").textContent = stats.longestDistance + ' km';
    document.getElementById("minDistanceStat").textContent = stats.shortestDistance + ' km';
    document.getElementById("aveDistanceStat").textContent = stats.averageDistance.toFixed(2) + ' km';

    document.getElementById("totalDurationStat").textContent = stats.totalDuration.toFixed(2) + ' h';
    document.getElementById("maxDurationStat").textContent = stats.longestDuration.toFixed(2) + ' h';
    document.getElementById("minDurationStat").textContent = stats.shortestDuration.toFixed(2) + ' h';
    document.getElementById("aveDurationStat").textContent = stats.averageDuration.toFixed(2) + ' h';
    document.getElementById("nighttimeStat").textContent = stats.nighttimePercentage + ' %';

    await createConditionsDOM(conditions);

    const weatherStats = calculateConditionPercentages(sessions, conditions.weathers, 'weather');
    updateStatsDisplay(weatherStats);

    const hazardStats = calculateConditionPercentages(sessions, conditions.hazards, 'hazards');
    updateStatsDisplay(hazardStats);

    const maneuverStats = calculateConditionPercentages(sessions, conditions.maneuvers, 'maneuvers');
    updateStatsDisplay(maneuverStats);

    const parkingStats = calculateConditionPercentages(sessions, conditions.parkings, 'parkings');
    updateStatsDisplay(parkingStats);

    const roadtypeStats = calculateConditionPercentages(sessions, conditions.roadtypes, 'roadtypes');
    updateStatsDisplay(roadtypeStats);

  } catch (error) {
    console.error(error);
    showError('An error occurred while initializing the application: ' + error.message);
  }
}

document.addEventListener("DOMContentLoaded", init);
