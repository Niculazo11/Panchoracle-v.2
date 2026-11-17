import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { renameClassroom } from "../../lib/classroomApi.js";
import { validateClassroomName } from "./classroomForm.js";

// State and rename logic of the settings page.
// classroom, setClassroom and showError come from TeacherShell (through the Outlet).
export function useClassroomSettings() {
    const { classroom, setClassroom, showError } = useOutletContext();
    const [name, setName] = useState(classroom ? classroom.name : "");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Nothing to save while the typed name is the same as the current one.
    const unchanged = classroom ? name.trim() === classroom.name : true;

    function handleChange(event) {
        setName(event.target.value);
        setError("");
        setSaved(false);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        showError("");
        setSaved(false);

        const nameError = validateClassroomName(name);
        setError(nameError);

        if (nameError !== "") {
            return;
        }

        setSaving(true);

        try {
            const updated = await renameClassroom(classroom.id, name.trim());

            // The whole teacher area now sees the new name without asking the server again.
            setClassroom(updated);
            setName(updated.name);
            setSaved(true);
        } catch (err) {
            showError(err.name === "ApiError" ? err.message : "Could not reach the server.");
        }

        setSaving(false);
    }

    return { classroom, name, error, saving, saved, unchanged, showError, handleChange, handleSubmit };
}
