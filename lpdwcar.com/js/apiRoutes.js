async function getSessions() {
    try {
        const response = await fetch(`/api/session/all`);
        if (!response.ok) {
            throw new Error(`Failed to fetch sessions: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching sessions:', error);
        throw new Error(error.message);
    }
}

async function getTotalTravelDistance() {
    try {
        const response = await fetch(`/api/session/distance`);
        if (!response.ok) {
            throw new Error(`Failed to fetch total travel distance: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching total travel distance:', error);
        throw new Error(error.message);
    }
}

async function getSession(sessionId) {
    try {
        const response = await fetch(`/api/session/get/${sessionId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch session: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching session:', error);
        throw new Error(error.message);
    }
}

async function saveSession(sessionData) {
    try {
        const response = await fetch(`/api/session/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to save session');
        }

        return responseData;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function deleteSession(sessionId) {
    try {
        const response = await fetch(`/api/session/delete/${sessionId}`);
        if (!response.ok) {
            throw new Error(`Failed to delete session: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error deleting session:', error);
        throw new Error(error.message);
    }
}

async function getConditions() {
    try {
        const response = await fetch(`/api/conditions/all`);
        if (!response.ok) {
            throw new Error(`Failed to fetch conditions: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching conditions:', error);
        throw new Error(error.message);
    }
}

async function getTranslations() {
    try {
        const response = await fetch(`/api/translations/all`);
        if (!response.ok) {
            throw new Error(`Failed to fetch translations: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching translations:', error);
        throw new Error(error.message);
    }
}

async function getTranslationsByLanguage(languageCode) {
    try {
        const response = await fetch(`/api/translations/${languageCode}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch translations for language ${languageCode}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching translations for language ${languageCode}:`, error);
        throw new Error(error.message);
    }
}

export { getSessions, getTotalTravelDistance, getSession, saveSession, deleteSession, getConditions, getTranslations, getTranslationsByLanguage };