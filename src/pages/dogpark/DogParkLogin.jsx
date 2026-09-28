import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Kept separate from the game's real login (Login.jsx / useLoginForm.js):
// this is a standalone gate in front of the Dog Park placeholder page,
// with its own tiny bit of local state — it doesn't touch GameState or
// the auth/access helpers used by the rest of the app.
const MIN_USERNAME_LENGTH = 3;

export default function DogParkLogin() {
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

    return (
        <div className="min-h-screen bg-[#74c398] flex flex-col px-6 py-8 sm:px-14 sm:py-10">

            {/* ---- Sign up (top-right, not wired up yet) ---- */}
            <div className="flex justify-end">
                <button
                    type="button"
                    aria-disabled="true"
                    title="Sign up isn't available yet."
                    onClick={(event) => event.preventDefault()}
                    className="px-5 py-2 bg-[#4b3f9e] text-white font-semibold rounded underline decoration-2 underline-offset-2 opacity-90 cursor-not-allowed"
                >
                    SIGN UP
                </button>
            </div>

            {/* ---- Title ---- */}
            <h1 className="font-display italic text-center text-5xl sm:text-6xl text-white mt-2 mb-14 sm:mb-16">
                Log In
            </h1>

            {/* ---- Form ---- */}
            <form onSubmit={handleSubmit} noValidate className="w-full max-w-2xl mx-auto flex flex-col gap-8">

                <div>
                    <label htmlFor="dogParkUsername" className="block text-white text-lg mb-2">
                        Username
                    </label>
                    <input
                        id="dogParkUsername"
                        name="dogParkUsername"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="w-full rounded px-4 py-3 bg-[#d9d9d9] text-black"
                    />
                </div>

                <div>
                    <label htmlFor="dogParkPassword" className="block text-white text-lg mb-2">
                        Password
                    </label>
                    <input
                        id="dogParkPassword"
                        name="dogParkPassword"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded px-4 py-3 bg-[#d9d9d9] text-black"
                    />
                </div>

                {error && (
                    <p role="alert" className="text-white bg-black/20 rounded px-3 py-2 text-sm text-center">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="mx-auto px-10 py-2 bg-[#4b3f9e] text-white font-semibold rounded underline decoration-2 underline-offset-2"
                >
                    ENTER
                </button>
            </form>
        </div>
    );
}
