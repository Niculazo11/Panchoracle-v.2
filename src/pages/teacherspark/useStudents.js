import { useState, useEffect, useRef, useCallback } from "react";
import { getStudents, removeStudent } from "../../lib/classroomApi.js";
import { usePolling } from "../../lib/usePolling.js";

function messageOf(err) {
    return err.name === "ApiError" ? err.message : "Could not reach the server.";
}

// Loads the students of a classroom and keeps them fresh with usePolling (UN-305),
// so the bars follow the server clock (UN-108). `students` is null until the first answer.
export function useStudents(classroomId) {
    const [students, setStudents] = useState(null);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);
    const aliveRef = useRef(true);

    // Late answers must not update a page that is already closed.
    useEffect(() => {
        aliveRef.current = true;
        return () => {
            aliveRef.current = false;
        };
    }, []);

    const load = useCallback(async () => {
        try {
            const list = await getStudents(classroomId);
            if (aliveRef.current) {
                setStudents(list);
                setError("");
            }
        } catch (err) {
            if (aliveRef.current) {
                setError(messageOf(err));
            }
        }
    }, [classroomId]);

    const { refresh } = usePolling(load);

    // Unenrolls a student, then asks the server again so the list is the real one.
    async function remove(studentId) {
        setRemovingId(studentId);
        try {
            await removeStudent(classroomId, studentId);
            if (aliveRef.current) {
                setStudents((current) => current.filter((s) => s.id !== studentId));
            }
            refresh();
        } catch (err) {
            if (aliveRef.current) {
                setError(messageOf(err));
            }
        } finally {
            if (aliveRef.current) {
                setRemovingId(null);
            }
        }
    }

    return { students, error, removingId, remove, refresh };
}
