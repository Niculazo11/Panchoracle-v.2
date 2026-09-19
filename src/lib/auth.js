// Access flag used by <ProtectedRoute />. Kept in localStorage and
// exposed as a tiny observable store so React can re-render when it
// changes (useAccess.js subscribes to it).
const ACCESS_KEY = "panchoAccess";
const USER_KEY = "name";

let listeners = [];

function emit() {
    listeners.forEach((fn) => fn());
}

export function subscribeAccess(callback) {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter((fn) => fn !== callback);
    };
}

export function hasAccess() {
    try {
        return localStorage.getItem(ACCESS_KEY) === "true";
    } catch (error) {
        console.error("Could not read the access flag:", error);
        return false;
    }
}

export function grantAccess(username) {
    try {
        localStorage.setItem(ACCESS_KEY, "true");

        if (username) {
            localStorage.setItem(USER_KEY, username);
        }
    } catch (error) {
        console.error("Could not persist the access flag:", error);
    }

    emit();
}

export function revokeAccess() {
    try {
        localStorage.removeItem(ACCESS_KEY);
    } catch (error) {
        console.error("Could not clear the access flag:", error);
    }

    emit();
}
