import * as ls from "./locationServices.js";
import { createCheckbox, createRadio, showError } from "./uiComponents.js";
import { getConditions, saveSession } from "./apiRoutes.js";
import { loadTranslations } from "./translationManager.js";
import { sessionManager } from "./sessionManager.js";
import * as utils from "./utils.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runInit);
} else {
  await runInit();
}

async function runInit() {
  try {
    window.translations = await loadTranslations();
    await initializeDataEntryForm();
    setupFormHandlers();

    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("id");
    const source = urlParams.get("source");
    const headerSubtitleElement = document.querySelector("header hgroup p");

    const librariesDataEntry = ["places"];
    await ls.loadGoogleMapsApi(ls.initDataEntryMaps, librariesDataEntry);
    console.log("Google Maps API loaded and initialized for DataEntry page");

    if (sessionId) {
      sessionStorage.setItem("sessionId", sessionId);
      if (source === "SessionsOverview") {
        headerSubtitleElement.textContent =
          "Modification d'une session de conduite";
      }
      await sessionManager.loadSessionData(sessionId);
    } else {
      const sessionForm = document.getElementById("sessionForm");
      if (sessionForm) {
        sessionForm.reset();
      }
    }
  } catch (error) {
    console.error(error);
    showError(
      "An error occurred while initializing the data entry form : " +
        error.message
    );
  }
}

async function initializeDataEntryForm() {
  try {
    const data = await getConditions();
    if (data.status === "success") {
      for (const [category, conditions] of Object.entries(data.data)) {
        if (category === "weathers") {
          await createRadio(category, conditions, "conditionsContainer");
        } else {
          await createCheckbox(category, conditions, "conditionsContainer");
        }
      }
    } else {
      throw new Error("Failed to load conditions. Please try again later.");
    }
  } catch (error) {
    throw new Error(
      "Error fetching conditions. Please try again later." + error.message
    );
  }
}

function setupFormHandlers() {
  setupButtonListeners();
  setupInputListeners();
}

function getElementById(id) {
  return document.getElementById(id);
}

function setupButtonListeners() {
  getElementById("submitFormButton").addEventListener("click", submitForm);
  getElementById("getDeparturePositionButton").addEventListener("click", () =>
    setLocation("departureCoordinates")
  );
  getElementById("getDestinationPositionButton").addEventListener("click", () =>
    setLocation("destinationCoordinates")
  );
  getElementById("calculateBtn").addEventListener("click", calculateDistance);
}

function setupInputListeners() {
  getElementById("departureCoordinates").addEventListener("click", () =>
    manualEntry("departureCoordinates")
  );
  getElementById("destinationCoordinates").addEventListener("click", () =>
    manualEntry("destinationCoordinates")
  );
}

async function submitForm() {
  if (!utils.validateForm()) {
    console.warn("Validation error. Please check your input.");
    return;
  }
  try {
    const sessionData = sessionManager.collectSessionData();
    sessionStorage.removeItem("sessionId");
    const response = await saveSession(sessionData);
    if (response.status !== "success") {
      throw new Error("Failed to save session. Please try again later.");
    }
    if (!response.data) {
      throw new Error(
        "No session data returned from server. Please try again later."
      );
    }
    const savedSession = response.data;
    console.log("Session saved successfully", savedSession);
    window.location.href = `./SessionDetails.html?id=${savedSession.id}`;
  } catch (error) {
    throw new Error(
      "An error occurred during saveSession. Please try again later." +
        error.message
    );
  }
}

function setLocation(inputId) {
  try {
    ls.getGPSLocation(getElementById(inputId));
  } catch (error) {
    throw new Error(
      "An error occurred during fetching location. Please try again later." +
        error.message
    );
  }
}

function manualEntry(inputId) {
  try {
    ls.setupManualEntry(getElementById(inputId));
  } catch (error) {
    throw new Error(
      "An error occurred during manual entry. Please try again later." +
        error.message
    );
  }
}

function calculateDistance() {
  try {
    const setDistanceStatus = ls.setDistance(getElementById("travelDistance"));
    if (!setDistanceStatus) {
      setInvalidCoordinates();
    } else {
      getElementById("calculateBtn").value = setDistanceStatus;
      getElementById("departureCoordinates").setCustomValidity("");
    }
  } catch (error) {
    throw new Error(
      "An error occurred during distance calculation. Please try again later." +
        error.message
    );
  }
}

function setInvalidCoordinates() {
  const departureInput = getElementById("departureCoordinates");
  const destinationInput = getElementById("destinationCoordinates");
  departureInput.setCustomValidity("Coordonnées invalides.");
  destinationInput.setCustomValidity("Coordonnées invalides.");
  departureInput.reportValidity();
  destinationInput.reportValidity();
}

function resetFormAndRedirect(sessionId) {
  getElementById("sessionForm").reset();
}
