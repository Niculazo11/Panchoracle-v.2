// usePolling - Hook for periodic state refresh and focus-based sync (UN-303, UN-305)
// Replaces setInterval in RaisePancho and storage listener in PanchoStats
import { useEffect, useRef, useCallback } from "react";

export function usePolling(fetchFn, { intervalMs = 15000, enabled = true } = {}) {
    const intervalRef = useRef(null);
    const fetchRef = useRef(fetchFn);
    const enabledRef = useRef(enabled);
    const isFetchingRef = useRef(false);

    useEffect(() => { fetchRef.current = fetchFn; }, [fetchFn]);
    useEffect(() => { enabledRef.current = enabled; }, [enabled]);

    const doFetch = useCallback(async () => {
        if (!enabledRef.current || isFetchingRef.current) return;
        isFetchingRef.current = true;
        try { await fetchRef.current(); } finally { isFetchingRef.current = false; }
    }, []);

    // Periodic polling
    useEffect(() => {
        if (!enabled) return;
        const tick = () => doFetch();
        tick();
        intervalRef.current = window.setInterval(tick, intervalMs);
        return () => { if (intervalRef.current) { window.clearInterval(intervalRef.current); intervalRef.current = null; } };
    }, [doFetch, intervalMs, enabled]);

    // Focus/visibility refresh
    useEffect(() => {
        if (!enabled) return;
        const onVis = () => { if (!document.hidden) doFetch(); };
        const onFocus = () => doFetch();
        document.addEventListener("visibilitychange", onVis);
        window.addEventListener("focus", onFocus);
        return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onFocus); };
    }, [doFetch, enabled]);

    return { refresh: useCallback(() => doFetch(), [doFetch]) };
}