
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { validateJoinForm, EMPTY_JOIN_ERRORS } from "../../lib/formValidators.js";
import { hasErrors } from "../../lib/validation.js";
import { useAccess } from "../../lib/useAccess.js";
import { PARK_PATH } from "../teacherspark/teacherPaths.js";
import { useGameState } from "../../state/GameStateContext.jsx";

const EMPTY_FORM = { name: "", email: "", password: "", role: "student" };

export function useJoinForm() {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState(EMPTY_JOIN_ERRORS);
    const [formSuccessText, setFormSuccessText] = useState("Thanks for raising a Pancho!");
    const [submitting, setSubmitting] = useState(false);
    const { register } = useAccess();
    const { init } = useGameState();
    const navigate = useNavigate();

    function handleChange(field) {
        return (event) => {
            const { value } = event.target;
            setFormData((current) => ({ ...current, [field]: value }));
        };
    }

    // Called by the Teacher/Student buttons in JoinSection.
    // Sets the role immediately so the user sees feedback, then submits.
    const handleJoin = useCallback((role) => {
        setFormData((current) => ({ ...current, role }));
    }, []);

    async function handleSubmit(event) {
        const nextErrors = validateJoinForm(formData);
        setErrors(nextErrors);

        if (hasErrors(nextErrors)) {
            event.preventDefault();
            setFormSuccessText("");
            return;
        }

        event.preventDefault();
        setSubmitting(true);

        try {
            const user = await register({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
            });

            setFormSuccessText("Welcome to Raise a Pancho!");
            setFormData(EMPTY_FORM);
            setErrors(EMPTY_JOIN_ERRORS);

            // For students, initialize game state (loads Pancho/classroom) before navigating,
            // same as Login.jsx does. This ensures the student has their data when they land.
            if (user.role === "student") {
                await init().catch(() => {});
            }

            // Teacher -> TeachersPark (ClassroomsPanel). TeacherShell redirects to create-classroom if needed.
            // Student -> /raise (ChoosePancho shows JoinClassroomForm if no classroom yet).
            navigate(user.role === "teacher" ? PARK_PATH : "/raise");
        } catch (error) {
            setFormSuccessText("");
            setErrors({ email: error.message || "Error al registrarse" });
        } finally {
            setSubmitting(false);
        }
    }

    return { formData, errors, formSuccessText, submitting, handleChange, handleSubmit, handleJoin };
}
