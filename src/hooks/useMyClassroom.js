import { useState, useEffect, useCallback } from "react";
import { getMyClassroom } from "../lib/classroomApi.js";

// Loads the teacher's classroom when the page opens.
// status is "loading", "ready" or "error". classroom is null when there is none.
export function useMyClassroom() {
  const [status, setStatus] = useState("loading");
  const [classroom, setClassroom] = useState(null);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");

    getMyClassroom(controller.signal)
      .then((found) => {
        setClassroom(found);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          return;
        }
        // Server answers keep their message; anything else is a connection problem.
        setError(err.name === "ApiError" ? err.message : "Could not reach the server.");
        setStatus("error");
      });

    // Cleanup: cancel the request if the page closes or reloads first.
    return () => controller.abort();
  }, [reloadCount]);

  // Asks the server again (used by a retry button).
  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { status, classroom, error, setClassroom, reload };
}