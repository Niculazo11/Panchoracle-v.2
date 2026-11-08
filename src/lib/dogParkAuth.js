// Access flag for the Dog Park / Teachers Park area. It is deliberately
// separate from lib/auth.js (the student login): a student session must
// not open the teachers' area, and vice versa. Same tiny observable-store
// pattern, so useDogParkAccess.js can re-render React when it changes.
const ACCESS_KEY = "dogParkAccess";
const USER_KEY = "dogParkUser";

let listeners = [];

function emit() {
    listeners.forEach((fn) => fn());
}

export function subscribeDogParkAccess(callback) {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter((fn) => fn !== callback);
    };
}

export function hasDogParkAccess() {
    try {
        return localStorage.getItem(ACCESS_KEY) === "true";
    } catch (error) {
        console.error("Could not read the Dog Park access flag:", error);
        return false;
    }
}

export function grantDogParkAccess(username) {
    try {
        localStorage.setItem(ACCESS_KEY, "true");
        if (username) localStorage.setItem(USER_KEY, username);
    } catch (error) {
        console.error("Could not persist the Dog Park access flag:", error);
    }
    emit();
}

export function revokeDogParkAccess() {
    try {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(USER_KEY);
    } catch (error) {
        console.error("Could not clear the Dog Park access flag:", error);
    }
    emit();
}