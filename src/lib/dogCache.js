const DOG_CACHE_KEY = "cachedDachshundImages";

export function readCache() {
  try {
    const cached = localStorage.getItem(DOG_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Cached dog data was unreadable:", error);
    return null;
  }
}

export function writeCache(dogs) {
  try {
    localStorage.setItem(DOG_CACHE_KEY, JSON.stringify(dogs));
  } catch (error) {
    console.error("Could not cache the dog images:", error);
  }
}