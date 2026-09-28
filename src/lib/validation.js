// Field-level validators shared by every form of the app.
// The email rule is the "complex" one: a regular expression instead of
// the old `includes("@")` check.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(name) {
    const value = (name || "").trim();

    if (value === "") {
        return "Name is required.";
    }

    if (value.length < 2) {
        return "Name must have at least 2 characters.";
    }

    return "";
}

export function validateEmail(email) {
    const value = (email || "").trim();

    if (value === "") {
        return "Email is required.";
    }

    if (!EMAIL_REGEX.test(value)) {
        return "Please enter a valid email.";
    }

    return "";
}

export function validatePassword(password) {
    if (!password) {
        return "Password is required.";
    }

    if (password.length < 6) {
        return "Password must have at least 6 characters.";
    }

    return "";
}

// Second complex rule: cross-field match between password and its
// confirmation.
export function validateConfirmPassword(password, confirmation) {
    if (!confirmation) {
        return "Please confirm your password.";
    }

    if (confirmation !== password) {
        return "Passwords do not match.";
    }

    return "";
}

// True when the errors object holds at least one active message.
export function hasErrors(errors) {
    return Object.keys(errors || {}).some((key) => Boolean(errors[key]));
}
