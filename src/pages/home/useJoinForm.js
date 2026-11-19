import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateJoinForm, EMPTY_JOIN_ERRORS } from "../../lib/formValidators.js";
import { hasErrors } from "../../lib/validation.js";
import { useAccess } from "../../lib/useAccess.js";
import { PARK_PATH } from "../teacherspark/teacherPaths.js";

const EMPTY_FORM = { name: "", email: "", password: "" };

// Where each role lands right after joining.
// Teacher: the teacher's main panel (TeacherShell sends them on to create a classroom if needed).
// Student: the "Join a Classroom" view, where they type the class code their teacher gave them.
const STUDENT_PATH = "/choose";

export function useJoinForm() {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState(EMPTY_JOIN_ERRORS);
    const [formSuccessText, setFormSuccessText] = useState("Thanks for raising a Pancho!");
    const [submitting, setSubmitting] = useState(false);
    const { register } = useAccess();
    const navigate = useNavigate();

    function handleChange(field) {
        return (event) => {
            const { value } = event.target;
            setFormData((current) => ({ ...current, [field]: value }));
        };
    }

    // The role is chosen with the Teacher / Student buttons, never with the Enter key,
    // so pressing Enter in a field must not register anybody by accident.
    function handleSubmit(event) {
        event.preventDefault();
    }

    // Called by the Teacher and Student buttons. The button clicked decides the role.
    async function handleJoin(role) {
        if (submitting) return;

        const nextErrors = validateJoinForm(formData);
        setErrors(nextErrors);

        if (hasErrors(nextErrors)) {
            setFormSuccessText("");
            return;
        }

        setSubmitting(true);

        try {
            await register({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role,
            });

            setFormSuccessText("Welcome to Raise a Pancho!");
            setFormData(EMPTY_FORM);
            setErrors(EMPTY_JOIN_ERRORS);

            navigate(role === "teacher" ? PARK_PATH : STUDENT_PATH);
        } catch (error) {
            setFormSuccessText("");
            setErrors({ ...EMPTY_JOIN_ERRORS, email: error.message || "Error al registrarse" });
        } finally {
            setSubmitting(false);
        }
    }

    return { formData, errors, formSuccessText, submitting, handleChange, handleSubmit, handleJoin };
}
