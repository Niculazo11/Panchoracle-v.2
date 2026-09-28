import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 600;

// Returns true for a short moment every time `value` changes, so a
// component can attach an animation class (coin rewards, stat
// increments, Pancho eating) without storing anything in global state.
export function useChangeFlash(value, durationMs = DEFAULT_DURATION_MS) {
    const [flashing, setFlashing] = useState(false);
    const previousRef = useRef(value);

    useEffect(() => {
        if (previousRef.current === value) {
            return undefined;
        }

        previousRef.current = value;
        setFlashing(true);

        const timeoutId = window.setTimeout(() => setFlashing(false), durationMs);

        return () => window.clearTimeout(timeoutId);
    }, [value, durationMs]);

    return flashing;
}
