import { useState } from "react";
import { validateChooseForm, EMPTY_CHOOSE_ERRORS } from "../../lib/formValidators.js";
import { getStoredUsername } from "../../lib/dogApi.js";

export function useChooseForm() {
    const [formData, setFormData] = useState(() => ({
        name: getStoredUsername(),
        password: "",
        email: ""
    }));
    const [errors, setErrors] = useState(EMPTY_CHOOSE_ERRORS);

    function handleChange(field) {
        return (event) => {
            const { value } = event.target;
            setFormData((current) => ({ ...current, [field]: value }));
        };
    }

    // Validates every field at once and returns the errors object so
    // the caller can decide whether to block the submit.
    function validateAll() {
        const nextErrors = validateChooseForm(formData);
        setErrors(nextErrors);
        return nextErrors;
    }

    function setFieldError(field, message) {
        setErrors((current) => ({ ...current, [field]: message }));
    }

    // Only called after a fully successful confirmation. The username is
    // kept because it is the account the game state was just saved under.
    function resetAfterSuccess() {
        setFormData((current) => ({ name: current.name, password: "", email: "" }));
        setErrors(EMPTY_CHOOSE_ERRORS);
    }

    return { formData, errors, handleChange, validateAll, setFieldError, resetAfterSuccess };
}
