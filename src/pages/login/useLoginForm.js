import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { validateLoginForm, EMPTY_LOGIN_ERRORS } from "../../lib/formValidators.js";
import { hasErrors } from "../../lib/validation.js";
import { grantAccess } from "../../lib/auth.js";
import { getStoredUsername } from "../../lib/dogApi.js";

const EMPTY_FORM = { name: "", email: "", password: "", confirmPassword: "" };
const DEFAULT_TARGET = "/raise";

// <ProtectedRoute /> stores the blocked location in `state.from`; older
// links may carry a plain string instead.
function redirectTarget(state) {
    const from = state && state.from;

    if (!from) {
        return DEFAULT_TARGET;
    }

    if (typeof from === "string") {
        return from;
    }

    return (from.pathname || DEFAULT_TARGET) + (from.search || "");
}

export function useLoginForm() {
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState(() => ({
        ...EMPTY_FORM,
        name: getStoredUsername()
    }));
    const [errors, setErrors] = useState(EMPTY_LOGIN_ERRORS);

    function handleChange(field) {
        return (event) => {
            const { value } = event.target;
            setFormData((current) => ({ ...current, [field]: value }));
        };
    }

    function handleSubmit(event) {
        const nextErrors = validateLoginForm(formData);
        setErrors(nextErrors);

        // At least one active error -> block the submit, no navigation.
        if (hasErrors(nextErrors)) {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        localStorage.setItem("email", formData.email.trim());
        grantAccess(formData.name.trim());

        // Cleared only after a fully successful submit.
        setFormData(EMPTY_FORM);
        setErrors(EMPTY_LOGIN_ERRORS);

        navigate(redirectTarget(location.state), { replace: true });
    }

    return { formData, errors, handleChange, handleSubmit };
}
