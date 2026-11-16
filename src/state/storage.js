"use strict";

import { CURRENT_USER_KEY, FAVORITES_KEY, THEME_KEY } from "./constants.js";

// --- GameState persistence removed (UN-303): state now lives on the server ---
// This module now only handles favorites and dark mode (theme) in localStorage.

export function resolveUsername(username) {
    try {
        return username || localStorage.getItem(CURRENT_USER_KEY) || "guest";
    } catch (error) {
        console.error("Could not read the current user:", error);
        return username || "guest";
    }
}

// Favorites persistence (dog.ceo images the user liked)
export function loadFavorites() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error("Could not load favorites:", error);
        return [];
    }
}

export function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        return true;
    } catch (error) {
        console.error("Could not save favorites:", error);
        return false;
    }
}

// Theme persistence (dark/light mode)
export function loadTheme() {
    try {
        return localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
        console.error("Could not load theme:", error);
        return "light";
    }
}

export function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
        return true;
    } catch (error) {
        console.error("Could not save theme:", error);
        return false;
    }
}
