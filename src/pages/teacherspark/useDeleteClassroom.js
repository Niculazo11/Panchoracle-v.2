import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { deleteClassroom, getStudents } from "../../lib/classroomApi.js";

// State and delete logic of the delete section on the settings page.
// classroom, setClassroom and showError come from TeacherShell (through the Outlet).
export function useDeleteClassroom() {
    const { classroom, setClassroom, showError } = useOutletContext();
    const [confirmText, setConfirmText] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [studentCount, setStudentCount] = useState(null);
    const classroomId = classroom ? classroom.id : null;

    // Counts the students that will be unenrolled. The number is optional: if the
    // request fails the section still works, it just does not show the number.
    useEffect(() => {
        if (!classroomId) {
            return undefined;
        }

        const controller = new AbortController();

        getStudents(classroomId, controller.signal)
            .then((students) => setStudentCount(students.length))
            .catch(() => {});

        // Cleanup: cancel the request if the page closes first.
        return () => controller.abort();
    }, [classroomId]);

    // The typed text must equal the classroom name (capitals count, spaces at the ends do not).
    const matches = classroom ? confirmText.trim() === classroom.name : false;

    function handleChange(event) {
        setConfirmText(event.target.value);
    }

    async function handleDelete(event) {
        event.preventDefault();

        if (!matches) {
            return;
        }

        showError("");
        setDeleting(true);

        try {
            await deleteClassroom(classroom.id);

            // With no classroom, TeacherShell takes the teacher to the create page.
            setClassroom(null);
        } catch (error) {
            showError(error.name === "ApiError" ? error.message : "Could not reach the server.");
            setDeleting(false);
        }
    }

    return { classroom, confirmText, matches, deleting, studentCount, handleChange, handleDelete };
}
