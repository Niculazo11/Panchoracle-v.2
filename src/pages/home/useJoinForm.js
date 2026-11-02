import { useState } from "react";
import { validateJoinForm, EMPTY_JOIN_ERRORS } from "../../lib/formValidators.js";
import { hasErrors } from "../../lib/validation.js";
import { useAccess } from "../../lib/useAccess.js";

const EMPTY_FORM = { name: "", email: "", password: "", message: "" };

export function useJoinForm() {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState(EMPTY_JOIN_ERRORS);
    const [formSuccessText, setFormSuccessText] = useState("Thanks for raising a Pancho!");
    const { login } = useAccess();

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
            await login(formData.email.trim(), formData.password);
            setFormSuccessText("Welcome to Raise a Pancho!");
            setFormData(EMPTY_FORM);
            setErrors(EMPTY_JOIN_ERRORS);
        } catch (error) {
            setFormSuccessText("");
            setErrors({ email: error.message || "Error al registrarse" });
        }
    }

    return { formData, errors, formSuccessText, handleChange, handleSubmit };
}