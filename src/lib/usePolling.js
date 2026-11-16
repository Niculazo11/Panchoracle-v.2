// usePolling - Hook for periodic state refresh and focus-based sync (UN-303, UN-305)
// Replaces the setInterval in RaisePancho and the storage listener in PanchoStats
// Features:
// - Periodic polling with configurable interval
// - Refresh on window focus/visibility change
// - Cleanup of timers and listeners on unmount
// - Prevents polling during in-flight mutations

import { useEffect, useRef, useCallback } from "react";

export function usePolling(fetchFn, { intervalMs = 15000, enabled = true } = {}) {
    const intervalRef = useRef(null);
    const fetchRef = useRef(fetchFn);
    const enabledRef = useRef(enabled);
    const isFetchingRef = useRef(false);

    // Keep refs up to date without triggering re-renders
    useEffect(() => {
        fetchRef.current = fetchFn;
    }, [fetchFn]);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    const doFetch = useCallback(async () => {
        if (!enabledRef.current || isFetchingRef.current) return;
        isFetchingRef.current = true;
        try {
            await fetchRef.current();
        } finally {
            isFetchingRef.current = false;
        }
    }, []);

    // Periodic polling
    useEffect(() => {
        if (!enabled) return;

        const tick = () => {
            doFetch();
        };

        // Initial fetch
        tick();

        // Set up interval
        intervalRef.current = window.setInterval(tick, intervalMs);

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [doFetch, intervalMs, enabled]);

    // Focus/visibility refresh - re-fetch when tab becomes visible
    useEffect(() => {
        if (!enabled) return;

        const onVisibilityChange = () => {
            if (!document.hidden) {
                doFetch();
            }
        };

        const onFocus = () => {
            doFetch();
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("focus", onFocus);

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("focus", onFocus);
        };
    }, [doFetch, enabled]);

    // Manual trigger for immediate refresh
    const refresh = useCallback(() => {
        doFetch();
    }, [doFetch]);

    return { refresh };
}