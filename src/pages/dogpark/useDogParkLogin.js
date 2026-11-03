import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { grantDogParkAccess } from "../../lib/dogParkAuth.js";

const MIN_USERNAME_LENGTH = 3;
const DEFAULT_TARGET = "/teachersPark";

// <ProtectedRoute /> stores the blocked location in `state.from`. If the
// person opened the login directly (no `from`), they land on the Teachers Park.
export function redirectTarget(state) {
    const from = state && state.from;

    if (!from) return DEFAULT_TARGET;
    if (typeof from === "string") return from;

    return (from.pathname || DEFAULT_TARGET) + (from.search || "");
}

// State + validation of the standalone Dog Park gate. It doesn't touch
// GameState or the student auth helpers; it only sets the Dog Park flag.
export function useDogParkLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(event) {
        event.preventDefault();

        const trimmed = username.trim();

        if (trimmed.length < MIN_USERNAME_LENGTH) {
            setError("Username must be at least 3 characters.");
            return;
        }

        if (!password) {
            setError("Password is required.");
            return;
        }

        setError("");
        grantDogParkAccess(trimmed);
        navigate(redirectTarget(location.state), { replace: true });
    }

    return { username, setUsername, password, setPassword, error, handleSubmit };
}