import { useState, useEffect, useCallback } from "react";
import { getAssignments } from "../../lib/assignmentApi.js";
import { getMySubmissions } from "../../lib/submissionApi.js";

// Loads every assignment of the classroom and the student's own submissions.
// status is "loading", "ready" or "error". addSubmission() records a new one without reloading.
export function useStudentHomework() {
    const [status, setStatus] = useState("loading");
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [error, setError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setStatus("loading");

        Promise.all([getAssignments(controller.signal), getMySubmissions(controller.signal)])
            .then(([list, mine]) => {
                setAssignments(list);
                setSubmissions(mine);
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
    }, [reloadCount]);

    const reload = useCallback(() => setReloadCount((count) => count + 1), []);
    const addSubmission = useCallback((submission) => setSubmissions((current) => [...current, submission]), []);

    return { status, assignments, submissions, error, reload, addSubmission };
}
