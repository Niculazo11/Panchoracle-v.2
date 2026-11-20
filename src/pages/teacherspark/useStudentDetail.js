import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getStudentSubmissions } from "../../lib/classroomApi.js";

// Loads all submissions for a specific student in a classroom (teacher view).
// status is "loading", "ready" or "error"; reload() asks the server again.
export function useStudentDetail() {
    const { classroomId, studentId } = useParams();
    const [status, setStatus] = useState("loading");
    const [student, setStudent] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [error, setError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setStatus("loading");

        getStudentSubmissions(classroomId, studentId, controller.signal)
            .then((data) => {
                setStudent(data.student);
                setSubmissions(data.submissions);
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
    }, [classroomId, studentId, reloadCount]);

    const reload = useCallback(() => setReloadCount((count) => count + 1), []);

    return { status, student, submissions, error, reload };
}