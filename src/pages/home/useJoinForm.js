
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateJoinForm, EMPTY_JOIN_ERRORS } from "../../lib/formValidators.js";
import { hasErrors } from "../../lib/validation.js";
import { useAccess } from "../../lib/useAccess.js";
import { roleFromAnswer } from "../../lib/joinRole.js";
import { PARK_PATH } from "../teacherspark/teacherPaths.js";

const EMPTY_FORM = { name: "", email: "", password: "", message: "" };

export function useJoinForm() {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState(EMPTY_JOIN_ERRORS);
    const [formSuccessText, setFormSuccessText] = useState("Thanks for raising a Pancho!");
    const { register } = useAccess();
    const navigate = useNavigate();

    function handleChange(field) {
        return (event) => {
            const { value } = event.target;
            setFormData((current) => ({ ...current, [field]: value }));
        };
    }

    async function handleSubmit(event) {
        const nextErrors = validateJoinForm(formData);
        setErrors(nextErrors);

        if (hasErrors(nextErrors)) {
            event.preventDefault();
            setFormSuccessText("");
            return;
        }

        event.preventDefault();

        try {
            // The "student or teacher?" answer decides the role. Anything that does not say
            // "teacher" stays a student. No code is needed: typing "teacher" is enough.
            const user = await register({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: roleFromAnswer(formData.message),
            });

            setFormSuccessText("Welcome to Raise a Pancho!");
            setFormData(EMPTY_FORM);
            setErrors(EMPTY_JOIN_ERRORS);

            // A new teacher goes to the teacher park; TeacherShell sends them on to the
            // create-classroom page when they do not have a classroom yet.
            if (user.role === "teacher") navigate(PARK_PATH);
        } catch (error) {
            setFormSuccessText("");
            setErrors({ email: error.message || "Error al registrarse" });
        }
    }

    return { formData, errors, formSuccessText, handleChange, handleSubmit };
}
