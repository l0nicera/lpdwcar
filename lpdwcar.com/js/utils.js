import {calculateDistanceFromGpsPoints, setDistance} from "./locationServices.js";
import {loadTranslations} from "./translationManager.js";
import {getFromStorage} from "./localstorageManager.js";

/**
 * Retourne la date et l'heure actuelle sous le même format que datetime-local en prennant en compte le
 * décalage horaire
 */
function setCurrentDateTime() {
  const initDate = new Date();

  const timezoneDiff = initDate.getTimezoneOffset() * 60000; // Date() utilise les millisecondes comme unité

  const localDateTime = new Date(initDate - timezoneDiff).toISOString(); // On soustrait le décallage horaire (getTimezoneOffset() donne des valeurs inversées : UTC+1 = -60)

  return localDateTime.slice(0, 16); // On garde que la date et l'heure sans secondes et millisecondes
}

/**
 *  Récupère les valeurs multiples d'un champ (checkbox ou select) lorsqu'il y en a
 * @param {HTMLElement} form - le form dans lequel se trouve ce champ
 * @param {string} fieldName - le nom du champ dans lequel récupérer les valeurs
 * @returns {Array} - tableau contenant toutes les valeurs du champ
 */
function getMultipleValues(form, fieldName) {
  const allFieldElements = form.querySelectorAll(`[name="${fieldName}"]`); //  récupère tous les éléments correspondants au nom du champ
  let selectedValues = []; // initialise le tableau pour stocker les valeurs

  allFieldElements.forEach((e) => {
    if (e.type === "checkbox" && e.checked) {
      selectedValues.push(e.value); // si la case est coché, push sa valeur dans le tableau
    } else if (e.type === "select-multiple") {
      Array.from(e.selectedOptions).forEach((opt) => {
        // créé une collection avec les options qui sont selectionnées puis parcours chaque élément
        selectedValues.push(opt.value); //si une option est selectionnée, push sa valeur dans le tableau
      });
    }
  });
  return selectedValues;
}

/**
 * Renvoie la traduction ou le string d'origine si pas trouvé.
 * @param {string} str - La clé de la traduction recherchée.
 * @returns {Promise<string>} La traduction ou le string d'origine si aucune traduction n'est trouvée.
 */
async function translateToStoredLocal(str) {
  if (!window.translations || typeof window.translations !== 'object') {
    console.log("Translations object is undefined or not an object");
    window.translations = await loadTranslations();
  }

  if (window.translations[str]) {
    return window.translations[str];
  } else {
    console.log("No translation found for " + str);
    return str;
  }
}



function resetElement(elementId) {
  const element = document.getElementById(elementId);
  element.value = "";
  element.setAttribute("data-source", "");
}

function toggleAttribute(element, attr) {
  if (element.hasAttribute(attr)) {
    element.removeAttribute(attr);
  } else {
    element.setAttribute(attr, "");
  }
}

function setFormField(form, fieldName, sessionValue) {

  const fields = form[fieldName];
  if (!fields) {
    console.warn(`Champ "${fieldName}" non trouvé dans le formulaire.`);
    return;
  }

  if (!sessionValue || sessionValue.length === 0) {
    if (fields.type === "checkbox" || fields.type === "radio") {
      Array.from(fields).forEach(field => field.checked = false);
    } else if (fields.type === "select-one" || fields.type === "select-multiple") {
      Array.from(fields.options).forEach(option => option.selected = false);
    } else {
      fields.value = "";
    }
    return;
  }

  if (fields.type === "checkbox") {
    // Gestion d'un seul checkbox avec valeur booléenne
    fields.checked = Boolean(sessionValue);
  } else if (
    fields.type === "select-one" ||
    fields.type === "select-multiple"
  ) {
    // Gestion des champs de type select
    if (Array.isArray(sessionValue)) {
      Array.from(fields.options).forEach((option) => { option.selected = sessionValue.includes(option.value) });
    } else {
      fields.value = sessionValue || "";
    }
  } else if (fields.length) {
    // Gestion d'un groupe de checkboxes ou de boutons radio (choix multiples)
    Array.from(fields).forEach((field) => {
      if (field.type === "checkbox" || field.type === "radio") {
        field.checked = sessionValue.some(item => String(item.id) === field.value);
      }
    });
  } else {
    // Pour les autres types de champs
    fields.value = sessionValue || "";
  }
}

function formatDatetime(datetimeStr, formatType = "combined") {
  const dt = new Date(datetimeStr);
  const date = dt.toLocaleDateString("fr-FR");
  const time = dt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (formatType === "combined") {
    return `${date} à ${time}`;
  } else if (formatType === "split") {
    return [date, time];
  }
}

function calculElapsedTime(startDatetimeStr, endDatetimeStr) {
  const startDt = new Date(startDatetimeStr);
  const endDt = new Date(endDatetimeStr);
  const elapsedMs = endDt - startDt;

  const hours = Math.floor(elapsedMs / 3600000); // 3600000 ms dans une heure
  const minutes = Math.round((elapsedMs % 3600000) / 60000); // 60000 ms dans une minute

  return [hours, minutes];
}

let intervalId;
function toggleCounter() {

  const timerDisplay = document.getElementById("timerDisplay");
  const timeElapsedSpan = document.getElementById("timeElapsed");
  const distanceCoveredSpan = document.getElementById("distanceCovered");
  const sessionControlBtn = document.getElementById("sessionControlBtn");


  if (sessionControlBtn.classList.contains("start")) {

    let currentSession = getFromStorage('currentSession');


    let startTime = Date.now();
    let elapsedTime = 0;

    if (currentSession && currentSession.recovered) {
      const sessionStartDate = new Date(currentSession.start_datetime).getTime();
      const lastPoint = currentSession.gps_points[currentSession.gps_points.length - 1];

      if (lastPoint) {
        const lastGpsDate = new Date(lastPoint.recordedAt).getTime();
        elapsedTime = lastGpsDate - sessionStartDate;
        startTime = Date.now() - elapsedTime;
      } else {
        startTime = Date.now();
      }
    }
      intervalId = setInterval(() => {
      const currentTime = Date.now();
      const diff = currentTime - startTime;
      const hours = Math.floor((diff / 3600000) % 24);
      const minutes = Math.floor((diff / 60000) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      timeElapsedSpan.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      currentSession = getFromStorage('currentSession');
      const distance = calculateDistanceFromGpsPoints(currentSession.gps_points);
      distanceCoveredSpan.textContent = distance >= 0 ? `${distance.toFixed(1)} km` : "calcul en cours...";
    }, 1000);

    timerDisplay.style.display = "block";
  } else {
    clearInterval(intervalId);
    timerDisplay.style.display = "none";
  }
}

function convertToDateTimeLocalFormat(dateTimeStr) {
  const date = new Date(dateTimeStr);
  return date.toISOString().slice(0, 16);
}

function formatDate(datetime) {
  try {
    const date = parseDateTime(datetime);
    if (isNaN(date.getTime())) {
      throw new Error("La date fournie n'est pas valide.");
    }

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error.message);
    return "Date non spécifiée";
  }
}

function formatTime(datetime) {
  const time = new Date(datetime);
  return time.toString() !== "Invalid Date" ? time.toLocaleTimeString() : "-";
}

function calculateDuration(start_datetime, stop_datetime) {
  try {
    const startDate = parseDateTime(start_datetime);
    const endDate = parseDateTime(stop_datetime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Les dates fournies ne sont pas valides.");
    }

    const durationMs = endDate - startDate;
    const durationHours = durationMs / (1000 * 60 * 60);

    return durationHours.toFixed(2);
  } catch (error) {
    console.error("Erreur lors du calcul de la durée:", error.message);
    return null;
  }
}


function parseDateTime(datetime) {
  if (datetime instanceof Date) {
    return datetime;
  } else if (typeof datetime === 'string') {
    return new Date(datetime);
  } else if (datetime && typeof datetime === 'object' && datetime.date) {
    return new Date(datetime.date);
  } else {
    throw new Error("Format de date non reconnu ou date manquante");
  }
}


function formatDuration(duration) {
  let hours, minutes;

  if (duration === null || isNaN(duration) || duration <= 0) return "-";

  if (duration >= 3600000) {
    hours = Math.floor(duration / 3600000);
    minutes = Math.floor((duration % 3600000) / 60000);
  } else {
    hours = Math.floor(duration);
    minutes = Math.floor((duration - hours) * 60);
  }

  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}


function formatDistance(distance) {
  return distance && distance >= 1 ? `${distance} km` : "-";
}

function validateForm() {
  const startDateInput = document.getElementById("setDateTimeStart");
  const stopDateInput = document.getElementById("setDateTimeStop");
  const distanceInput = document.getElementById("travelDistance");
  const departureInput = document.getElementById("departureCoordinates");
  const destinationInput = document.getElementById("destinationCoordinates");

  if (!startDateInput || startDateInput.value === "") {
    startDateInput.setCustomValidity("La date et l'heure de départ sont obligatoires.");
    startDateInput.reportValidity();
  } else {
    startDateInput.setCustomValidity("");
  }

  if (!stopDateInput || stopDateInput.value === "") {
    stopDateInput.setCustomValidity("La date et l'heure d'arrivée sont obligatoires.");
    stopDateInput.reportValidity();
  } else {
    stopDateInput.setCustomValidity("");
  }

  if (
    !startDateInput ||
    startDateInput.value === "" ||
    !stopDateInput ||
    stopDateInput.value === ""
  ) {
    return false;
  }
  const startDate = new Date(startDateInput.value);
  const endDate = new Date(stopDateInput.value);
  const startYear = startDate.getFullYear().toString();
  const endYear = endDate.getFullYear().toString();
  if (startYear.length !== 4 || endYear.length !== 4) {
    startDateInput.setCustomValidity(
      "Les années doivent être composées de 4 chiffres."
    );
    startDateInput.reportValidity();
    stopDateInput.setCustomValidity(
      "Les années doivent être composées de 4 chiffres."
    );
    stopDateInput.reportValidity();
    return false;
  } else {
    startDateInput.setCustomValidity("");
    stopDateInput.setCustomValidity("");
  }

  if (
    startDate.getFullYear() < 1900 ||
    startDate.getFullYear() > 2099 ||
    endDate.getFullYear() < 1900 ||
    endDate.getFullYear() > 2099
  ) {
    startDateInput.setCustomValidity(
      "Les dates doivent être entre 1900 et 2099."
    );
    startDateInput.reportValidity();
    stopDateInput.setCustomValidity(
      "Les dates doivent être entre 1900 et 2099."
    );
    stopDateInput.reportValidity();
    return false;
  } else {
    startDateInput.setCustomValidity("");
    stopDateInput.setCustomValidity("");
  }

  if (startDate >= endDate) {
    startDateInput.setCustomValidity(
      "La date ou l'heure de départ doivent être inférieures à celle d'arrivée."
    );
    startDateInput.reportValidity();
    stopDateInput.setCustomValidity(
      "La date ou l'heure de départ doivent être inférieures à celle d'arrivée."
    );
    stopDateInput.reportValidity();
    return false;
  } else {
    startDateInput.setCustomValidity("");
    stopDateInput.setCustomValidity("");
  }

  let distance = parseInt(distanceInput.value, 10);

  if (isNaN(distance) || distance < 1 || distance > 9999) {
    if (departureInput.value && destinationInput.value) {
      distance = setDistance(distanceInput);

      if (isNaN(distance) || distance < 1 || distance > 9999) {
        distanceInput.setCustomValidity(
          "Distance invalide ou impossible à calculer."
        );
        distanceInput.reportValidity();
        return false;
      } else {
        distanceInput.setCustomValidity("");
        distanceInput.value = distance;
      }
    } else {
      distanceInput.setCustomValidity(
        "Veuillez entrer une distance valide (1 à 9999)."
      );
      distanceInput.reportValidity();
      return false;
    }
  } else {
    distanceInput.setCustomValidity("");
  }

  return true;
}

export {
  validateForm,
  setCurrentDateTime,
  getMultipleValues,
  translateToStoredLocal,
  resetElement,
  toggleAttribute,
  setFormField,
  formatDatetime,
  calculElapsedTime,
  toggleCounter,
  convertToDateTimeLocalFormat,
  formatDistance,
  formatDuration,
  calculateDuration,
  formatTime,
  formatDate,
};
