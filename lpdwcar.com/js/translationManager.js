import { getFromStorage, saveToStorage } from "./localstorageManager.js";
import { getTranslationsByLanguage } from "./apiRoutes.js";

function transformTranslationsArrayToObject(translationsArray) {
    const translationsObject = {};
    translationsArray.forEach(item => {
        translationsObject[item.key_name] = item.translation;
    });
    return translationsObject;
}

async function loadTranslations(language = 'fr') {
    try {
        let translations = getFromStorage(`translations_${language}`);
        if (!translations) {
            const response = await getTranslationsByLanguage(language);
            if (response.status !== "success") {
                throw new Error(`Failed to fetch translations: ${response.message}`);
            }
            translations = response.data;
            saveToStorage(`translations_${language}`, JSON.stringify(translations));
        }
        return transformTranslationsArrayToObject(translations);
    } catch (error) {
        throw new Error("An error occurred while loading translations: " + error.message);
    }
}

export { loadTranslations };
