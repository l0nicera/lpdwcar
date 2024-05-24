import { getFromStorage, saveToStorage } from "./localstorageManager.js";
import { Session } from "./apiTypes.js";
import { showAlert } from "./uiComponents.js";

let watchId;

/**
 * Initializes and starts GPS tracking.
 *
 * Initiates the process of continuous GPS tracking, logging the current geographic
 * position (latitude and longitude) at regular intervals. Use browser's Geolocation API
 * to watch the device's position and updates the coordinates.
 *
 * @returns {boolean} Returns `true` in succes.
 *                    Returns `false` otherwise.
 */
function startGpsTracking() {
  try {
    console.log("Démarrage du suivi GPS...");

    if (location.protocol !== "https:") {
      throw new Error(
        "La géolocalisation nécessite un contexte sécurisé (HTTPS)."
      );
    }

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const recordedAt = new Date().toISOString();
          const currentSession = new Session(getFromStorage("currentSession"));
          if (!currentSession) {
            throw new Error(
              "Aucune session active pour ajouter des points GPS."
            );
          }
          currentSession.gps_points.push({ lat, lng, recordedAt });
          saveToStorage("currentSession", currentSession);
          console.log(`Position mise à jour : ${lat}, ${lng}`);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            throw new Error(
              "L'utilisateur a refusé la demande de géolocalisation."
            );
          } else if (error.code === error.TIMEOUT) {
            console.warn("Le délai d'acquisition de la position GPS a expiré.");
          } else {
            throw new Error("Erreur de géolocalisation: " + error.message);
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
      return true;
    } else {
      throw new Error("Géolocalisation non prise en charge par le navigateur.");
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Stops the ongoing GPS tracking.
 *
 * Stop the GPS tracking initiated by <code>startGpsTracking()</code>.
 *
 * @returns {boolean} Returns `true` in succes.
 *                    Returns `false` if no active GPS tracking to stop.
 */
function stopGpsTracking() {
  try {
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
      console.log("Suivi GPS correctement arrêté.");
      watchId = undefined;
      return true;
    } else {
      throw new Error("Le suivi GPS n'était pas actif.");
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

function calculateDistanceFromGpsPoints(gpsPoints) {
  try {
    if (!gpsPoints || gpsPoints.length <= 1) {
      console.warn("Not enough GPS points to calculate distance.");
      return 0;
    }

    let totalDistance = 0;
    for (let i = 1; i < gpsPoints.length; i++) {
      const prev = gpsPoints[i - 1];
      const curr = gpsPoints[i];
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(prev.lat, prev.lng),
        new google.maps.LatLng(curr.lat, curr.lng)
      );
      totalDistance += distance;
    }

    return totalDistance / 1000;
  } catch (error) {
    console.error(error.message);
    return 0;
  }
}

/**
 * Displays a route on a map based on session data using Google Maps API.
 *
 * Render a route either by using start and stop coordinates or by using an array of GPS points if available.
 *
 * @param {Object} session  The session data. It must have either a `gps_points` array or `startCoords` and `stopCoords` properties.
 *                          `gps_points` should be an array of objects with `lat` and `lng` properties.
 *                          `startCoords` and `stopCoords` can be either strings representing coordinates or objects with `lat` and `lng` properties.
 * Usage:
 * - If `gps_points` is available and has at least one point, the function constructs a route using these points as waypoints.
 * - If `gps_points` is not available or empty, and both `startCoords` and `stopCoords` are provided, the function constructs a route using these start and stop coordinates.
 * - If neither valid `gps_points` nor `startCoords` and `stopCoords` are available, an error message is shown to the user.
 */
function displayRouteOnMap(session) {
  try {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 4,
      },
    });

    directionsRenderer.setMap(map);

    if (
      session.gps_points &&
      session.gps_points.length > 0 &&
      session.start_coords &&
      session.stop_coords
    ) {
      const useGPSPoints = confirm(
        "Des points GPS ainsi que des coordonnées de départ et d'arrêt sont disponibles. Voulez-vous utiliser les points GPS pour l'itinéraire ?"
      );
      if (useGPSPoints) {
        plotRouteWithGPSPoints(session, directionsService, directionsRenderer);
      } else {
        plotRouteWithStartStopCoords(
          session,
          directionsService,
          directionsRenderer
        );
      }
    } else if (session.gps_points && session.gps_points.length > 0) {
      plotRouteWithGPSPoints(session, directionsService, directionsRenderer);
    } else if (session.start_coords && session.stop_coords) {
      plotRouteWithStartStopCoords(
        session,
        directionsService,
        directionsRenderer
      );
    } else {
      showAlert(
        "Aucune donnée de position disponible pour cette session. Le trajet ne peut être tracé."
      );
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

function plotRouteWithGPSPoints(
  session,
  directionsService,
  directionsRenderer
) {
  try {
    console.log(
      "Points GPS disponibles, construction de l'itinéraire avec waypoints"
    );

    const waypoints = session.gps_points.slice(1, -1).map((point) => ({
      location: new google.maps.LatLng(point.latitude, point.longitude),
      stopover: true,
    }));

    const origin = new google.maps.LatLng(
      session.gps_points[0].latitude,
      session.gps_points[0].longitude
    );
    const destination = new google.maps.LatLng(
      session.gps_points[session.gps_points.length - 1].latitude,
      session.gps_points[session.gps_points.length - 1].longitude
    );

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(response);
        } else {
          console.error(
            "Erreur de demande d'itinéraire avec waypoints: " + status
          );
          drawPolylineFallback(session.gps_points);
        }
      }
    );
  } catch (error) {
    throw new Error("Erreur de demande d'itinéraire: " + error.message);
  }
}

function plotRouteWithStartStopCoords(
  session,
  directionsService,
  directionsRenderer
) {
  try {
    let origin, destination;

    if (typeof session.start_coords === "string") {
      origin = convertToLatLng(session.start_coords);
    } else {
      origin = new google.maps.LatLng(
        session.start_coords.lat,
        session.start_coords.lng
      );
    }

    if (typeof session.stop_coords === "string") {
      destination = convertToLatLng(session.stop_coords);
    } else {
      destination = new google.maps.LatLng(
        session.stop_coords.lat,
        session.stop_coords.lng
      );
    }

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(response);
        } else {
          throw new Error("Erreur de demande d'itinéraire: " + status);
        }
      }
    );
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Draws a polyline on the map as a fallback route.
 *
 * Fallback mechanism for displaying a route on the map when the primary method of using Google Maps API's DirectionsService fails.
 * Takes an array of GPS points and draws a polyline connecting these points on the map.
 *
 * The polyline is styled to be geodesic, with a specified color, opacity, and weight for the stroke.
 * After drawing the polyline, the map view is adjusted to fit the bounds of the polyline.
 *
 * @param {Array<Object>} points - GPS points through which the polyline will pass. Each object in the array must have `lat` (latitude) and `lng` (longitude) properties.
 *
 */
function drawPolylineFallback(points) {
  try {
    const path = points.map(
      (point) => new google.maps.LatLng(point.latitude, point.longitude)
    );
    const fallbackRoute = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });

    fallbackRoute.setMap(map);
    const bounds = new google.maps.LatLngBounds();
    for (let point of path) {
      bounds.extend(point);
    }
    map.fitBounds(bounds);
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Sets the GPS location to an HTML input element.
 *
 * Attempts to retrieve the current GPS coordinates using the Geolocation API
 * and sets these coordinates as the value of a specified HTML input element. It also stores
 * the latitude and longitude as data attributes (`data-lat` and `data-lng`) on the element
 * and marks the source of the data as 'navigator' by setting the `data-source` attribute.
 *
 * @param {HTMLElement} input The HTML input element where the GPS location will be set.
 */
function getGPSLocation(input) {
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          input.setAttribute("data-source", "navigator");
          input.setAttribute("data-lat", lat);
          input.setAttribute("data-lng", lng);
          input.value = `${lat}, ${lng}`;
          console.log(`Coordonnées GPS de ${input.id} : ${lat}, ${lng}`);
        },
        (error) => {
          throw new Error("Erreur de géolocalisation: " + error.message);
        }
      );
    } else {
      throw new Error("Géolocalisation non prise en charge par le navigateur.");
    }
  } catch (error) {
    console.error(error.message);
  }
}

/**
 * Initializes Google Places Autocomplete on an HTML input element.
 *
 * Enhances an HTML input element by attaching Google Places Autocomplete
 * functionality to it, enabling users to search for places and select them. Once a place
 * is selected, the function retrieves the place's geographic coordinates and updates
 * the input element's data attributes with these coordinates (`data-lat` and `data-lng`),
 * and sets the source of the data as 'places' by updating the `data-source` attribute.
 *
 * @param {HTMLElement} input The HTML input element to attach the autocomplete functionality.
 * @param {Object} option Options for customizing the autocomplete functionality, such as
 *                        types of places to search for.
 * @returns {Object} The initialized google.maps.places.Autocomplete object.
 */
function initAutocomplete(input, option) {
  try {
    const placesAutocomplete = new google.maps.places.Autocomplete(
      input,
      option
    );

    placesAutocomplete.addListener("place_changed", () => {
      const place = placesAutocomplete.getPlace();
      if (!place.geometry) {
        throw new Error(
          `Impossible d'obtenir les coordonnées de ${input.name}`
        );
      }
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      input.setAttribute("data-source", "places");
      input.setAttribute("data-lat", lat);
      input.setAttribute("data-lng", lng);
      console.log(`Coordonnées de ${input.name} : ${lat}, ${lng}`);
    });

    return placesAutocomplete;
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Configures an HTML input element for manual entry of data.
 *
 * Checks the current source of the data (`data-source` attribute) of an HTML input element and updates the `data-source` attribute
 * to 'manual'. This indicates that any subsequent data entered in the input will be considered as manually entered by the user.
 *
 * @param {HTMLElement} input The HTML input element for which to set up manual data entry.
 */
function setupManualEntry(input) {
  try {
    const source = input.getAttribute("data-source");
    if (!source || source === "navigator" || source === "places") {
      input.setAttribute("data-source", "manual");
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Retrieves the coordinates from an input element and executes a callback with those coordinates.
 *
 * Fetches the latitude and longitude stored as data attributes (`data-lat` and `data-lng`)
 * in a given HTML input element. If both latitude and longitude are present, creates a new
 * google.maps.LatLng object with these coordinates and calls the provided callback function.
 *
 * @param {HTMLElement} input The HTML input element from which to retrieve the coordinates.
 * @param {Function} callback The callback function to execute with the LatLng object.
 *                            The callback should accept one argument: a google.maps.LatLng object.
 */
function getCoordinates(input, callback) {
  try {
    const lat = input.getAttribute("data-lat");
    const lng = input.getAttribute("data-lng");

    if (lat && lng) {
      const coords = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));
      console.log(`Coordonnées de ${input.name} : ${coords}`);
      callback(coords);
    } else {
      throw new Error(`Coordonnées non définies pour ${input.name}.`);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Calculates the driving distance and duration between two points using the Google Maps Distance Matrix API.
 *
 * Takes two google.maps.LatLng objects representing the departure and destination points,
 * validates them, and then queries the Google Maps Distance Matrix Service to calculate the driving
 * distance and duration between these points. The results, including the formatted distance and duration,
 * as well as the origin and destination addresses, are passed to a callback function.
 *
 * @param {google.maps.LatLng} departure The departure point as a google.maps.LatLng object.
 * @param {google.maps.LatLng} destination The destination point as a google.maps.LatLng object.
 * @param {Function} callback The callback function to be called with the result object containing
 *                            the origin, destination, distance, and duration if the API call is successful.
 *                            The result object has the shape { origin, destination, distance, duration }.
 */
function calculateDistance(departure, destination, callback) {
  try {
    if (!validMatrixValue(departure) || !validMatrixValue(destination)) {
      throw new Error(
        `Les coordonnées ${departure.value} et/ou ${destination.value} ne sont pas valides`
      );
    }
    const serviceMatrix = new google.maps.DistanceMatrixService();
    serviceMatrix.getDistanceMatrix(
      {
        origins: [departure],
        destinations: [destination],
        travelMode: "DRIVING",
        avoidTolls: false,
      },
      function (response, status) {
        if (status === "OK") {
          const origin = response.originAddresses[0];
          const destination = response.destinationAddresses[0];
          if (response.rows[0].elements[0].status === "OK") {
            const distance = response.rows[0].elements[0].distance.text;
            const duration = response.rows[0].elements[0].duration.text;
            callback({ origin, destination, distance, duration });
          } else {
            console.warning("Aucune donnée pour ces adresses");
          }
        } else {
          throw new Error(
            `Erreur lors du calcul entre les deux positions données : ${status}`
          );
        }
      }
    );
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Vérifie que la valeur soit valide pour être utilisé avec DistanceMatrix
 * Elle peut être une instance de google.maps.LatLng() ou un object avec des propriétés `lat` et `lng` qui sont des `number`
 * @param {google.maps.LatLng|Object} value - l'objet à vérifier
 * @returns {boolean} - retourne true si value correspond à un objet DistanceMatrix, faux sinon
 */
function validMatrixValue(value) {
  return (
    value instanceof google.maps.LatLng ||
    (value && typeof value.lat === "number" && typeof value.lng === "number")
  );
}

function extractNumberFromDistanceString(distanceStr) {
  const numberPattern = /[\d\s,]+/;
  let numberPart = distanceStr.match(numberPattern)[0];
  numberPart = numberPart.replace(/,/g, ".");
  numberPart = numberPart.replace(/\s/g, "");
  return Math.round(parseFloat(numberPart));
}

const departureInput = document.getElementById("departureCoordinates");
const destinationInput = document.getElementById("destinationCoordinates");

function setDistance(input) {
  try {
    const departureCoords = getLatLngFromInput(departureInput);
    const destinationCoords = getLatLngFromInput(destinationInput);

    if (!departureCoords || !destinationCoords) {
      throw new Error(
        "Les coordonnées de départ ou d'arrivée ne sont pas correctement définies."
      );
    }

    calculateDistance(departureCoords, destinationCoords, (data) => {
      input.value = Math.round(extractNumberFromDistanceString(data.distance));
      console.log(
        `Distance parcourue estimée : ${data.distance}, temps de trajet estimé : ${data.duration} entre les points ${data.origin} et ${data.destination}`
      );
    });
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}

function getLatLngFromInput(input) {
  try {
    const source = input.getAttribute("data-source");

    if (source === "places" || source === "navigator") {
      const lat = parseFloat(input.getAttribute("data-lat"));
      const lng = parseFloat(input.getAttribute("data-lng"));

      if (!isNaN(lat) && !isNaN(lng) && isValidLatLng(lat, lng)) {
        return new google.maps.LatLng(lat, lng);
      } else {
        throw new Error(
          "Les données de latitude ou de longitude sont invalides."
        );
      }
    } else if (source === "manual") {
      const userLatLng = input.value;
      if (userLatLng) {
        return convertToLatLng(userLatLng);
      }
    } else {
      throw new Error("Source de données non reconnue.");
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

function convertToLatLng(coordsStr) {
  try {
    console.log("convertToLatLng called with:", coordsStr);
    const parts = coordsStr.split(",").map((part) => parseFloat(part.trim()));
    if (parts.length === 2 && isValidLatLng(parts[0], parts[1])) {
      const latLng = new google.maps.LatLng(parts[0], parts[1]);
      console.log("Converted to LatLng:", latLng);
      return latLng;
    } else {
      throw new Error("Format de coordonnées invalide pour: " + coordsStr);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

function isValidLatLng(lat, lng) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function getCoords(form, elementName) {
  try {
    const element = form[elementName];
    if (!element) {
      throw new Error(`Element ${elementName} non trouvé`);
    }
    const lat = parseFloat(element.getAttribute("data-lat"));
    const lng = parseFloat(element.getAttribute("data-lng"));

    if (isValidLatLng(lat, lng)) {
      return `${lat},${lng}`;
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

function setCoordinates(elementId, coords) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Élément avec l'ID ${elementId} introuvable.`);
    }

    if (!coords || coords === "") {
      console.log(`Aucune coordonnée fournie pour ${elementId}.`);
      return;
    }

    let lat, lng;

    if (typeof coords === "string") {
      const latLng = coords.split(",").map((part) => parseFloat(part.trim()));
      if (latLng.length === 2 && isValidLatLng(latLng[0], latLng[1])) {
        lat = latLng[0];
        lng = latLng[1];
      } else {
        throw new Error(
          `Erreur lors de la récupération des coordonnées pour ${elementId}.`
        );
      }
    } else if (
      typeof coords === "object" &&
      coords.hasOwnProperty("lat") &&
      coords.hasOwnProperty("lng")
    ) {
      lat = coords.lat;
      lng = coords.lng;
      if (!isValidLatLng(lat, lng)) {
        throw new Error(`Coordonnées invalides pour ${elementId}.`);
      }
    } else {
      throw new Error(`Format de coordonnées non reconnu pour ${elementId}.`);
    }

    element.value = `${lat},${lng}`;
    element.setAttribute("data-lat", lat.toString());
    element.setAttribute("data-lng", lng.toString());
  } catch (error) {
    throw new Error(error.message);
  }
}

function initHomeMaps() {}

function initDataEntryMaps() {
  try {
    const options = {
      componentRestrictions: { country: "fr" },
      fields: ["address_components", "geometry"],
    };
    initAutocomplete(departureInput, options);
    initAutocomplete(destinationInput, options);
  } catch (error) {
    throw new Error(error.message);
  }
}

let map;
function initSessionDetails() {
  try {
    const routeMap = document.getElementById("routeMap");
    if (routeMap) {
      map = new google.maps.Map(routeMap, {
        center: { lat: 48.8566, lng: 2.3522 }, // Paris
        zoom: 8,
      });
    } else {
      throw new Error("L'élément map n'a pas été trouvé dans le DOM.");
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

function loadGoogleMapsApi(initCallback, libraries = []) {
  return new Promise((resolve, reject) => {
    try {
      if (window.google && window.google.maps) {
        initCallback();
        resolve();
        return;
      }

      const script = document.createElement("script");
      let librariesQuery = "";
      const apiKey = "";
      if (libraries.length > 0) {
        librariesQuery = `&libraries=${libraries.join(",")}`;
      }
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesQuery}&callback=initMaps&loading=async`;

      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      window.initMaps = () => {
        initCallback();
        resolve();
      };

      script.onerror = () => {
        throw new Error("Google Maps API failed to load");
      };
    } catch (error) {
      reject(error);
    }
  });
}

export {
  initAutocomplete,
  getGPSLocation,
  calculateDistance,
  getCoordinates,
  setDistance,
  setupManualEntry,
  startGpsTracking,
  stopGpsTracking,
  calculateDistanceFromGpsPoints,
  displayRouteOnMap,
  loadGoogleMapsApi,
  initDataEntryMaps,
  initHomeMaps,
  initSessionDetails,
  convertToLatLng,
  isValidLatLng,
  setCoordinates,
  getCoords,
};
