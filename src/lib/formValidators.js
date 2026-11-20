import {
    validateName,
    validateEmail,
    validatePassword
} from "./validation.js";

// Whole-form validators: they always return an errors object with the
// same shape as formData, so handleSubmit can check it in one go.
export function validateJoinForm(formData) {
    return {
        name: validateName(formData.name),
        email: validateEmail(formData.email),
        password: validatePassword(formData.password)
    };
}

export function validateChooseForm(formData) {
    return {
        name: validateName(formData.name),
        password: validatePassword(formData.password),
        email: validateEmail(formData.email)
    };
}

// The login form only has email and password: "name" and "confirmPassword"
/// are not validated (they don't exist on that screen). The password only
/// needs to be present; the length policy is enforced at registration, not login.
export function validateLoginForm(formData) {
    return {
        email: validateEmail(formData.email),
        password: formData.password ? "" : "Password is required."
    };
}

export const EMPTY_JOIN_ERRORS = { name: "", email: "", password: "" };
export const EMPTY_CHOOSE_ERRORS = { name: "", password: "", email: "" };
export const EMPTY_LOGIN_ERRORS = { email: "", password: "" };
