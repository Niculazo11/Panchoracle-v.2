"use strict";

import { CURRENT_USER_KEY, STATE_PREFIX } from "./constants.js";
import { defaultState, normalizeState } from "./defaults.js";

export function resolveUsername(username) {
    try {
        return username || localStorage.getItem(CURRENT_USER_KEY) || "guest";
    } catch (error) {
        console.error("Could not read the current user:", error);
        return username || "guest";
    }
}

export function stateKey(username) {
    return STATE_PREFIX + username;
}

// Loads the given user's state from localStorage. Any failure (storage
// unavailable, quota/permission errors, corrupted or half-written JSON)
// falls back to the defaults from defaults.js instead of throwing.
export function loadState(username) {

    let raw = null;

    try {
        raw = localStorage.getItem(stateKey(username));
    } catch (error) {
        console.error("localStorage is not available, using defaults:", error);
        return defaultState(username);
    }

    if (!raw) {
        return defaultState(username);
    }

    try {
        return normalizeState(JSON.parse(raw), username);
    } catch (error) {
        console.error("GameState was corrupted, resetting:", error);
        return defaultState(username);
    }
}

// Never lets a storage failure (private mode, quota exceeded) break the
// game: the in-memory state keeps working, only persistence is lost.
export function persistState(username, state) {
    try {
        localStorage.setItem(stateKey(username), JSON.stringify(state));
        return true;
    } catch (error) {
        console.error("Could not save the game state:", error);
        return false;
    }
}
