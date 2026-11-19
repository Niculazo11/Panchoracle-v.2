import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getAssignment } from "../../lib/assignmentApi.js";
import { getAssignmentSubmissions } from "../../lib/submissionApi.js";

// Loads one assignment and everything the students handed in for it.
// status is "loading", "ready" or "error"; reload() asks the server again.
export function useSubmissions() {
    const { assignmentId } = useParams();
    const [status, setStatus] = useState("loading");
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [error, setError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setStatus("loading");

        Promise.all([
            getAssignment(assignmentId, controller.signal),
            getAssignmentSubmissions(assignmentId, controller.signal)
        ])
            .then(([found, list]) => {
                setAssignment(found);
                setSubmissions(list);
                setStatus("ready");
            })
            .catch((err) => {
                if (err.name === "AbortError") {
                    return;
                }
                setError(err.name === "ApiError" ? err.message : "Could not reach the server.");
                setStatus("error");
            });

        // Cleanup: cancel the requests if the page closes first.
        return () => controller.abort();
    }, [assignmentId, reloadCount]);

    const reload = useCallback(() => setReloadCount((count) => count + 1), []);

    return { status, assignment, submissions, error, reload };
}
