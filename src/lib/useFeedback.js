import { useCallback, useEffect, useRef, useState } from "react";

// Transient feedback message (the old #dashboardFeedback / #shopFeedback
// paragraphs). The pending timeout is cleared on unmount.
export function useFeedback(timeoutMs) {
    const [feedback, setFeedback] = useState("");
    const timeoutRef = useRef(null);

    const showFeedback = useCallback((message) => {
        if (!message) {
            return;
        }

        setFeedback(message);
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setFeedback(""), timeoutMs);
    }, [timeoutMs]);

    useEffect(() => {
        return () => window.clearTimeout(timeoutRef.current);
    }, []);

    return { feedback, showFeedback };
}
