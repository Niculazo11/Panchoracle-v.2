"use strict";

// ---------------------------------------------------------------------
// dogApi.js (React port)
// ---------------------------------------------------------------------
// Only the network call lives here now; the localStorage helpers moved
// to dogStorage.js and are re-exported below so existing imports keep
// working. getDachshunds() accepts an AbortSignal so the caller's
// useEffect cleanup can cancel an in-flight request.
//
// The first Pancho option is no longer fetched: it's a fixed local
// drawing (see STATIC_DOG_IMAGE, used by useDogImages.js). Only the
// second option still comes from the live API, so this module now only
// ever asks for and caches a single image.
// ---------------------------------------------------------------------

export {
    getStoredUsername,
    saveSelectedDog,
    getSelectedDog,
    dogIdFromUrl
} from "./dogStorage.js";

// First Pancho option: always this local drawing, never fetched.
export const STATIC_DOG_IMAGE = import.meta.env.BASE_URL + "images/pancho-choice1.png";

// Breed image list; we only need the first entry now (the second
// Pancho option).
const DOG_LIST_URL = "https://dog.ceo/api/breed/dachshund/images";

// Fallback cache of the last successfully fetched image.
const DOG_CACHE_KEY = "cachedDachshundImages";

function readCache() {
    try {
        const cached = localStorage.getItem(DOG_CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error("Cached dog data was unreadable:", error);
        return null;
    }
}

function writeCache(dogs) {
    try {
        localStorage.setItem(DOG_CACHE_KEY, JSON.stringify(dogs));
    } catch (error) {
        console.error("Could not cache the dog images:", error);
    }
}

// Returns { images, fromCache } where images is a 1-item array (the
// live API pick for the second Pancho option). An aborted request is
// re-thrown so the caller can ignore it instead of showing an error
// banner.
export async function getDachshunds(signal) {

    try {
        const response = await fetch(DOG_LIST_URL, { signal });

        if (!response.ok) {
            throw new Error("Could not retrieve dogs from the API.");
        }

        const data = await response.json();

        // Always the same one: the first image in the fixed list.
        const dogs = (data.message || []).slice(0, 1);

        if (dogs.length === 1) {
            writeCache(dogs);
        }

        return { images: dogs, fromCache: false };
    } catch (error) {

        if (error.name === "AbortError") {
            throw error;
        }

        console.error("Dog API error:", error);

        const cached = readCache();

        return cached
            ? { images: cached, fromCache: true }
            : { images: [], fromCache: false };
    }
}
