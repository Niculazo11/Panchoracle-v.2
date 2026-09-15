"use strict";

// ---------------------------------------------------------------------
// dogApi.js (React port)
// ---------------------------------------------------------------------
// Same data/localStorage logic as the original js/dogApi.js. The parts
// that used to manipulate the DOM directly (querying/marking the <img>
// elements, toggling classes, reading inputs by id) have been removed
// here — that responsibility now lives in the ChoosePancho page
// component's useState, per the migration plan (Fase 2: eliminate
// document.getElementById / classList usage in favor of React state).
// ---------------------------------------------------------------------

// Full (non-random) list of images for the breed. Every visitor gets the
// same fixed pair of Pancho models, since we always take the first two.
const DOG_LIST_URL = "https://dog.ceo/api/breed/dachshund/images";

// Selections are stored per user: "selectedPancho_<username>"
const SELECTED_DOG_PREFIX = "selectedPancho_";

// Reuses the same localStorage key the join form on index.html already saves,
// so a user who joined there doesn't have to type their name again here.
const CURRENT_USER_KEY = "name";

// Fallback cache of the last successfully fetched pair of dog images, used
// when the API call fails.
const DOG_CACHE_KEY = "cachedDachshundImages";

// The single source of truth for fetching (and caching) the dog images.
// Returns { images, fromCache }:
//   - On a successful fetch: images from the API, fromCache: false, and the
//     result is saved to localStorage for next time.
//   - On a failed fetch with a cache available: the cached images,
//     fromCache: true.
//   - On a failed fetch with no cache: empty images, fromCache: false —
//     callers should treat this exactly like the old "no dogs" error case.
export async function getDachshunds() {

    try {
        const response = await fetch(DOG_LIST_URL);

        if (!response.ok) {
            throw new Error("Could not retrieve dogs from the API.");
        }

        const data = await response.json();
        const allImages = data.message || [];

        // Always the same two: the first two images in the breed's fixed list.
        const dogs = allImages.slice(0, 2);

        if (dogs.length === 2) {
            localStorage.setItem(DOG_CACHE_KEY, JSON.stringify(dogs));
        }

        return { images: dogs, fromCache: false };
    } catch (error) {
        console.error("Dog API error:", error);

        const cached = localStorage.getItem(DOG_CACHE_KEY);

        if (cached) {
            try {
                return { images: JSON.parse(cached), fromCache: true };
            } catch (parseError) {
                console.error("Cached dog data was corrupted:", parseError);
            }
        }

        return { images: [], fromCache: false };
    }
}

export function getStoredUsername() {
    return localStorage.getItem(CURRENT_USER_KEY) || "";
}

export function saveSelectedDog(dogImage, username) {

    if (!username) {
        return false;
    }

    localStorage.setItem(SELECTED_DOG_PREFIX + username, dogImage);
    localStorage.setItem(CURRENT_USER_KEY, username);

    return true;
}

export function getSelectedDog(username) {

    const user = username || localStorage.getItem(CURRENT_USER_KEY);

    if (!user) {
        return null;
    }

    return localStorage.getItem(SELECTED_DOG_PREFIX + user);
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
