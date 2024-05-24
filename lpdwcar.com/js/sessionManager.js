import * as locationService from "./locationServices.js";
import * as wakeLock from "./wakeLock.js";
import {Session} from "./apiTypes.js";
import {getSession, saveSession} from "./apiRoutes.js";
import * as utils from "./utils.js";
import {initGauge} from "./gaugeKm.js"
import {getMultipleValues, setFormField} from "./utils.js";
import {getCoords, setCoordinates} from "./locationServices.js";
import {getFromStorage, saveToStorage} from "./localstorageManager.js";

export const sessionManager = {

  async startSession() {
    try {
      let currentSession = {};
      if (window.location.protocol === 'https:') {
        await wakeLock.requestWakeLock();

        const storedSession = getFromStorage('currentSession');

        if (storedSession && Object.keys(storedSession).length > 0) {
          if (window.confirm("Do you want to resume the previous session?")) {
            currentSession = storedSession;
            currentSession['recovered'] = true;
          } else {
            localStorage.removeItem('currentSession');
            currentSession = new Session();
            currentSession.start_datetime = new Date().toISOString().split('.')[0] + 'Z';
          }
        } else {
          currentSession = new Session();
          currentSession.start_datetime = new Date().toISOString().split('.')[0] + 'Z';
        }

        if (!locationService.startGpsTracking()) {
          throw new Error("GPS tracking failed to start.");
        }
      } else {
        throw new Error('GPS tracking only works with HTTPS');
      }

      saveToStorage('currentSession', currentSession);
      utils.toggleCounter();
      return true;
    } catch (error) {
      throw new Error("An error occurred during startSession: " + error.message);
    }
  },

  async stopSession() {
    utils.toggleCounter();
    try {
      if (window.location.protocol === 'https:') {
        const gpsTrackingStopped = locationService.stopGpsTracking();
        if (!gpsTrackingStopped) {
          throw new Error("GPS tracking failed to stop.");
        }
      }

      await wakeLock.releaseWakeLock();

      const currentSession = new Session(getFromStorage('currentSession'));
      if (currentSession) {
        currentSession.stop_datetime = new Date().toISOString().split('.')[0] + 'Z';
        const gpsPoints = currentSession.gps_points;
        if (gpsPoints) {
          if (gpsPoints.length >= 2) {
            try {
              currentSession.travel_distance = Math.round(locationService.calculateDistanceFromGpsPoints(gpsPoints));
            } catch (e) {
              console.warn('Impossible de calculer la distance entre les points GPS :', e.message);
            }
            const startPoint = gpsPoints[0];
            const stopPoint = gpsPoints[gpsPoints.length - 1];
            currentSession.start_coords = `${startPoint.lat},${startPoint.lng}`;
            currentSession.stop_coords = `${stopPoint.lat},${stopPoint.lng}`;
          } else if (gpsPoints.length === 1) {
            const point = gpsPoints[0];
            currentSession.start_coords = `${point.lat},${point.lng}`;
          }
        }

        try {
          const response = await saveSession(currentSession);
          if (response.status !== "success") {
            throw new Error(`Failed to save session: ${response.message}`);
          }
          if (!response.data) {
            throw new Error("No session data returned from server");
          }
          const storedSession = response.data;
          saveToStorage('currentSession', storedSession);
        } catch (e) {
          throw new Error('Une erreur est survenue lors de la sauvegarde de la session : ' + e.message);
        }

        await initGauge();
      } else {
        throw new Error("No active session");
      }
      return true;
    } catch (error) {
      throw new Error("An error occurred during stopSession: " + error.message);
    }
  },

  async loadSessionData(sessionId) {
    try {
      const response = await getSession(sessionId);
      if (response.status !== "success") {
        throw new Error(`Failed to fetch session details: ${response.message}`);
      }
      if (!response.data) {
        throw new Error(`No session data found for session: ID ${sessionId}`);
      }
      const session = new Session(response.data);
      this.fillSessionForm(session);
    } catch (error) {
      throw new Error("An error occurred during loadSessionData: " + error.message);
    }
  },

  fillSessionForm(data) {
    try {
      const form = document.getElementById("sessionForm");
      form["start_datetime"].value = data.start_datetime.toISOString().slice(0, 16);
      form["stop_datetime"].value = data.stop_datetime.toISOString().slice(0, 16);
      form["travelDistance"].value = data.travel_distance;
      setCoordinates("departureCoordinates", data.start_coords);
      setCoordinates("destinationCoordinates", data.stop_coords);
      form["nightDriving"].checked = data.nighttime;
      setFormField(form, "hazards", data.hazards);
      setFormField(form, "weathers", data.weathers);
      setFormField(form, "roadtypes", data.roadtypes);
      setFormField(form, "parkings", data.parkings);
      setFormField(form, "maneuvers", data.maneuvers);
    } catch (error) {
      throw new Error("An error occurred during fillSessionForm:" + error.message);
    }
  },

  collectSessionData() {
    try {
      const sessionForm = document.getElementById("sessionForm");
      return {
        id: sessionStorage.getItem('sessionId'),
        start_datetime: sessionForm['setDateTimeStart'].value,
        stop_datetime: sessionForm['setDateTimeStop'].value,
        start_coords: getCoords(sessionForm, "departureCoordinates"),
        stop_coords: getCoords(sessionForm, "destinationCoordinates"),
        travel_distance: parseInt(sessionForm["travelDistance"].value),
        nighttime: sessionForm["nightDriving"].checked,
        hazards: getMultipleValues(sessionForm, "hazards"),
        maneuvers: getMultipleValues(sessionForm, "maneuvers"),
        parkings: getMultipleValues(sessionForm, 'parkings'),
        roadtypes: getMultipleValues(sessionForm, 'roadtypes'),
        weather: sessionForm["weathers"].value
      };
    } catch (error) {
      throw new Error("An error occurred during collectSessionData: " + error.message);
    }
  }



};
