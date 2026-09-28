import DogParkField from "./DogParkField.jsx";
import { useDogParkLogin } from "./useDogParkLogin.js";

// Kept separate from the game's real login (Login.jsx / useLoginForm.js):
// this is a standalone gate in front of the Dog Park placeholder page,
// with its own tiny bit of local state (see useDogParkLogin.js).
export default function DogParkLogin() {
    const { username, setUsername, password, setPassword, error, handleSubmit } = useDogParkLogin();

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

                <DogParkField
                    id="dogParkUsername"
                    label="Username"
                    autoComplete="username"
                    value={username}
                    onChange={setUsername}
                />

                <DogParkField
                    id="dogParkPassword"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={setPassword}
                />

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
