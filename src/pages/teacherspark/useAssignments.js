import { useState, useEffect, useCallback } from "react";
import { getAssignments } from "../../lib/assignmentApi.js";

// Loads the classroom's assignments when the page opens.
// status is "loading", "ready" or "error"; reload() asks the server again.
export function useAssignments() {
    const [status, setStatus] = useState("loading");
    const [assignments, setAssignments] = useState([]);
    const [error, setError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setStatus("loading");
        setError("");

        getAssignments(controller.signal)
            .then((list) => {
                setAssignments(list);
                setStatus("ready");
            })
            .catch((err) => {
                if (err.name === "AbortError") {
                    return;
                }
                setError(err.name === "ApiError" ? err.message : "Could not reach the server.");
                setStatus("error");
            });

        // Cleanup: cancel the request if the page closes first.
        return () => controller.abort();
    }, [reloadCount]);

    const reload = useCallback(() => setReloadCount((count) => count + 1), []);

    return { status, assignments, error, reload };
}
