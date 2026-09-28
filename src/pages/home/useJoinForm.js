import { useState } from "react";
import { validateJoinForm, EMPTY_JOIN_ERRORS } from "../../lib/formValidators.js";
import { hasErrors } from "../../lib/validation.js";
import { grantAccess } from "../../lib/auth.js";

const EMPTY_FORM = { name: "", email: "", password: "", message: "" };

export function useJoinForm() {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState(EMPTY_JOIN_ERRORS);
    const [formSuccessText, setFormSuccessText] = useState("Thanks for raising a Pancho!");

    function handleChange(field) {
        return (event) => {
            const { value } = event.target;
            setFormData((current) => ({ ...current, [field]: value }));
        };
    }

    function handleSubmit(event) {
        const nextErrors = validateJoinForm(formData);
        setErrors(nextErrors);

        // At least one active error -> block the submit and stop here.
        if (hasErrors(nextErrors)) {
            event.preventDefault();
            setFormSuccessText("");
            return;
        }

        event.preventDefault();

        localStorage.setItem("email", formData.email.trim());
        grantAccess(formData.name.trim()); // also stores "name"

        setFormSuccessText("Welcome to Raise a Pancho!");

        // State is only cleared after a fully successful submit.
        setFormData(EMPTY_FORM);
        setErrors(EMPTY_JOIN_ERRORS);
    }

    return { formData, errors, formSuccessText, handleChange, handleSubmit };
}
