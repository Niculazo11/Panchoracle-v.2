// useCosmetics - Fetches and caches cosmetics catalog from API (UN-303 RF-5)
// Replaces local import of src/data/catalog.js
import { useState, useEffect, useCallback } from "react";
import { fetchCosmetics } from "./gameApi.js";
import { asset } from "./asset.js";

let cosmeticsCache = null;
const listeners = new Set();

function notify() {
    listeners.forEach((fn) => fn(cosmeticsCache));
}

export function useCosmetics() {
    const [cosmetics, setCosmetics] = useState(cosmeticsCache);
    const [loading, setLoading] = useState(!cosmeticsCache);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (cosmeticsCache) {
            setCosmetics(cosmeticsCache);
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);

        fetchCosmetics()
            .then((serverCosmetics) => {
                // Resolve image paths via asset() for Vite base
                // Map cosmeticId -> id for frontend compatibility
                const resolved = serverCosmetics.map((c) => ({
                        ...c,
                        id: c.id ?? c.cosmeticId,
                        image: c.image ? asset(c.image) : null,
                    }));
                if (mounted) {
                    cosmeticsCache = resolved;
                    setCosmetics(resolved);
                    setLoading(false);
                    notify();
                }
            })
            .catch((err) => {
                if (mounted) {
                    setError(err.message || "Failed to load cosmetics");
                    setLoading(false);
                }
            });

        return () => { mounted = false; };
    }, []);

    const refresh = useCallback(async () => {
        cosmeticsCache = null;
        setLoading(true);
        setError(null);
        try {
            const serverCosmetics = await fetchCosmetics();
            const resolved = serverCosmetics.map((c) => ({
                    ...c,
                    id: c.id ?? c.cosmeticId,
                    image: c.image ? asset(c.image) : null,
                }));
            cosmeticsCache = resolved;
            setCosmetics(resolved);
            notify();
        } catch (err) {
            setError(err.message || "Failed to load cosmetics");
        } finally {
            setLoading(false);
        }
    }, []);

    return { cosmetics, loading, error, refresh };
}