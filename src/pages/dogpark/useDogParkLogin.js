import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MIN_USERNAME_LENGTH = 3;

// State + validation of the standalone Dog Park gate. It doesn't touch
// GameState or the auth/access helpers used by the rest of the app.
export function useDogParkLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(event) {
        event.preventDefault();

        const trimmed = username.trim();
        const isLongEnough = trimmed.length >= MIN_USERNAME_LENGTH;

        if (!isLongEnough) {
            setError("Username must be at least 3 characters.");
            return;
        }

        setError("");
        navigate("/dogpark");
    }

    return { username, setUsername, password, setPassword, error, handleSubmit };
}
