import {
    validateName,
    validateEmail,
    validatePassword,
    validateConfirmPassword
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

export function validateLoginForm(formData) {
    return {
        name: validateName(formData.name),
        email: validateEmail(formData.email),
        password: validatePassword(formData.password),
        confirmPassword: validateConfirmPassword(
            formData.password,
            formData.confirmPassword
        )
    };
}

export const EMPTY_JOIN_ERRORS = { name: "", email: "", password: "" };
export const EMPTY_CHOOSE_ERRORS = { name: "", password: "", email: "" };
export const EMPTY_LOGIN_ERRORS = {
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
};
