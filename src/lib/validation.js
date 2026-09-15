export function validateName(name) {
    if (name.trim() === "") {
        return "Name is required.";
    }

    if (name.trim().length < 2) {
        return "Name must have at least 2 characters.";
    }

    return "";
}


export function validateEmail(email) {
    if (email.trim() === "") {
        return "Email is required.";
    }

    if (!email.includes("@")) {
        return "Please enter a valid email.";
    }

    return "";
}


export function validatePassword(password) {
    if (password === "") {
        return "Password is required.";
    }

    if (password.length < 6) {
        return "Password must have at least 6 characters.";
    }

    return "";
}
