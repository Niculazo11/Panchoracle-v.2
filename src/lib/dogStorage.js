// localStorage helpers around the chosen Pancho (split out of dogApi.js
// so each module stays small: this file never touches the network).
// Every read/write is guarded so a blocked or full storage degrades
// gracefully instead of crashing the page.

// Selections are stored per user: "selectedPancho_<username>"
const SELECTED_DOG_PREFIX = "selectedPancho_";

// Reuses the same localStorage key the join form on Home already saves,
// so a user who joined there doesn't have to type their name again here.
const CURRENT_USER_KEY = "name";

function readKey(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.error("Could not read from localStorage:", error);
        return null;
    }
}

function writeKey(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error("Could not write to localStorage:", error);
        return false;
    }
}

export function getStoredUsername() {
    return readKey(CURRENT_USER_KEY) || "";
}

export function saveSelectedDog(dogImage, username) {

    if (!username) {
        return false;
    }

    const saved = writeKey(SELECTED_DOG_PREFIX + username, dogImage);

    return saved && writeKey(CURRENT_USER_KEY, username);
}

export function getSelectedDog(username) {

    const user = username || readKey(CURRENT_USER_KEY);

    if (!user) {
        return null;
    }

    return readKey(SELECTED_DOG_PREFIX + user);
}

// Derives a stable id from the dog image URL (the dog.ceo API doesn't
// expose an id of its own), for example:
// ".../dachshund/n02085620_10074.jpg" -> "n02085620_10074"
export function dogIdFromUrl(url) {
    if (!url) {
        return null;
    }

    const fileName = url.split("/").pop() || url;
    return fileName.replace(/\.[a-zA-Z0-9]+$/, "");
}
