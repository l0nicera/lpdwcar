import {translateToStoredLocal,} from "./utils.js";

function createFieldset() {
  return document.createElement("fieldset");
}

/**
 * Créé un nouveau fieldset avec l'argument comme texte de légende
 * puis le traduit en français.
 */
async function createFieldsetAndLegend(legendText) {
  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = await translateToStoredLocal(legendText);
  fieldset.appendChild(legend);
  return fieldset;
}

/**
 * Crée un nouveau <dropdown> avec <h3> depuis le jeu de donnée fourni.
 *
 * @param {string} category - Nom de la condition.
 * @param {Array} data - Jeu de données utilisé.
 * @param {string} parentElementId - ID de l'élément parent où le fieldset sera ajouté.
 * @param {boolean} [required=false] - Optionnel : true pour rendre required.
 */
async function createDropdown(category, data, parentElementId, required = false) {
  if (typeof data === "undefined") {
    console.log(`Le jeu de donné fourni ` + data + " est vide ou incorrect");
  }

  const container = document.getElementById(parentElementId);
  const header = document.createElement("h3");
  header.className = "form__heading";
  header.textContent = await translateToStoredLocal(category);
  container.appendChild(header);

  const selectList = document.createElement("select");
  selectList.name = Object.keys(data[1])[1];
  if (required) {
    selectList.setAttribute("required", "required");
  }
  selectList.appendChild(new Option("Sélectionner...", ""));
  for (const item of data) {
    selectList.appendChild(
        new Option(
            await translateToStoredLocal(item[Object.keys(item)[1]]),
            item[Object.keys(item)[0]]
        )
    );
  }
  container.appendChild(selectList);
}

/**
 * Crée des <radio>, leurs <label> et un <h3> pour légende depuis le jeu de donnée fourni.
 *
 * @param {string} category - Nom de la condition.
 * @param {Array} data - Jeu de données utilisé.
 * @param {string} parentElementId - ID de l'élément parent où le fieldset sera ajouté.
 * @param {boolean} [required=false] - Optionnel : true pour rendre required.
 */
async function createRadio(category, data, parentElementId, required = false) {
  if (typeof data === "undefined") {
    console.log(`Le jeu de donné fourni ` + data + " est vide ou incorrect");
    return;
  }

  const container = document.getElementById(parentElementId);
  const header = document.createElement("h3");
  header.className = "form__heading";
  header.textContent = await translateToStoredLocal(category);
  container.appendChild(header);

  for (const item of data) {
    const radioElement = document.createElement("input");
    radioElement.type = "radio";
    radioElement.id = item[Object.keys(item)[1]];
    radioElement.name = category;
    radioElement.value = item[Object.keys(item)[0]];
    if (required) {
      radioElement.required = true;
    }

    const labelElement = document.createElement("label");
    labelElement.setAttribute("for", item[Object.keys(item)[1]]);
    labelElement.textContent = await translateToStoredLocal(
        item[Object.keys(item)[1]]
    );

    container.appendChild(radioElement);
    container.appendChild(labelElement);
  }

}

/**
 * Crée des <checkbox>, leurs <label> et un <h3> pour légende depuis le jeu de donnée fourni.
 *
 * @param {string} category - Nom de la condition.
 * @param {Array} data - Jeu de données utilisé.
 * @param {string} parentElementId - ID de l'élément parent où le fieldset sera ajouté.
 * @param {boolean} [required=false] - Optionnel : true pour rendre required.
 */
async function createCheckbox(category, data, parentElementId, required = false) {
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`Le jeu de donné fourni est vide ou n'existe pas`);
    return;
  }

  const container = document.getElementById(parentElementId);
  const header = document.createElement("h3");
  header.className = "form__heading";
  header.textContent = await translateToStoredLocal(category);
  container.appendChild(header);

  for (const item of data) {
    const key1 = Object.keys(item)[0];
    const key2 = Object.keys(item)[1];

    const checkboxElement = document.createElement("input");
    checkboxElement.type = "checkbox";
    checkboxElement.id = item[key2];
    checkboxElement.name = category;
    checkboxElement.value = item[key1];
    if (required) {
      checkboxElement.required = true;
    }

    const labelElement = document.createElement("label");
    labelElement.setAttribute("for", item[key2]);
    labelElement.textContent = await translateToStoredLocal(item[key2]);

    container.appendChild(checkboxElement);
    container.appendChild(labelElement);
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 7500);
}
function showAlert(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert-message';
  alertDiv.textContent = message;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 7500);
}

export {
  createDropdown,
  createRadio,
  createCheckbox,
  showError,
  showAlert
};

