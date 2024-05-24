function getFromStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        throw new Error('Error getting item from localStorage: ' + e);
    }
}

function saveToStorage(key, data) {
    try {
        if (typeof data === "string") {
            try {
                JSON.parse(data);
                localStorage.setItem(key, data);
            } catch {
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                } catch (e) {
                    throw new Error('Error saving item to localStorage: ' + e);
                }
            }
        } else {
            localStorage.setItem(key, JSON.stringify(data));
        }
        return true;
    } catch (e) {
        throw new Error('Error saving item to localStorage: ' + e);
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        throw new Error('Error removing item from localStorage: ' + e);
    }
}

function clearStorage() {
    try {
        localStorage.clear();
    } catch (e) {
        throw new Error('Error clearing localStorage: ' + e);
    }
}

export { getFromStorage, saveToStorage, removeFromStorage, clearStorage };