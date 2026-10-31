"use strict";

export {
  getStoredUsername,
  saveSelectedDog,
  getSelectedDog,
  dogIdFromUrl,
} from "./dogStorage.js";

export const STATIC_DOG_IMAGE = import.meta.env.BASE_URL + "images/pancho-choice1.png";

const DOG_LIST_URL = "https://dog.ceo/api/breed/dachshund/images";
import { readCache, writeCache } from "./dogCache.js";

export async function getDachshunds(signal) {
  try {
    const response = await fetch(DOG_LIST_URL, { signal });

    if (!response.ok) {
      throw new Error("Could not retrieve dogs from the API.");
    }

    const data = await response.json();
    const dogs = (data.message || []).slice(0, 1);

    if (dogs.length === 1) {
      writeCache(dogs);
    }

    return { images: dogs, fromCache: false };
  } catch (error) {
    if (error.name === "AbortError") throw error;

    console.error("Dog API error:", error);

    const cached = readCache();
    return cached
      ? { images: cached, fromCache: true }
      : { images: [], fromCache: false };
  }
}