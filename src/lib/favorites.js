// Favourite cosmetics are stored per user so two students sharing a
// browser don't overwrite each other's list.
const FAVORITES_PREFIX = "panchoFavorites_";
const CURRENT_USER_KEY = "name";

function keyFor(username) {
    const user = username || localStorage.getItem(CURRENT_USER_KEY) || "guest";
    return FAVORITES_PREFIX + user;
}

export function readFavorites(username) {
    try {
        const raw = localStorage.getItem(keyFor(username));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Favorites were corrupted, starting empty:", error);
        return [];
    }
}

export function writeFavorites(favorites, username) {
    try {
        localStorage.setItem(keyFor(username), JSON.stringify(favorites));
    } catch (error) {
        console.error("Could not save favorites:", error);
    }
}
