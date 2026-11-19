import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getStudents } from "../../lib/classroomApi.js";
import { pickParkDogs } from "./parkDogs.js";

// Loads the classroom's students and picks the dogs to show in the park.
// Returns { dogs, message }: message is a short text when there is nothing to draw.
// classroom and showError come from TeacherShell (through the Outlet).
export function useParkStudents() {
    const { classroom, showError } = useOutletContext();
    const [park, setPark] = useState(null);
    const classroomId = classroom ? classroom.id : null;

    useEffect(() => {
        if (!classroomId) {
            return undefined;
        }

        const controller = new AbortController();

        getStudents(classroomId, controller.signal)
            .then((students) => setPark({ dogs: pickParkDogs(students), total: students.length, failed: false }))
            .catch((error) => {
                if (error.name === "AbortError") {
                    return;
                }

                setPark({ dogs: [], total: 0, failed: true });
                showError(error.name === "ApiError" ? error.message : "Could not reach the server.");
            });

        // Cleanup: cancel the request if the page closes first.
        return () => controller.abort();
    }, [classroomId, showError]);

    // park is null while the students are loading: draw nothing yet.
    if (park === null) {
        return { dogs: [], message: "" };
    }

    if (park.total === 0 && !park.failed) {
        return { dogs: [], message: "No students have joined yet." };
    }

    return { dogs: park.dogs, message: "" };
}
