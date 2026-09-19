import { Link } from "react-router-dom";
import LoginForm from "./login/LoginForm.jsx";
import { useLoginForm } from "./login/useLoginForm.js";

// Destination of <ProtectedRoute /> when the access flag is missing.
// Uses the same palette as the join section on Home.
export default function Login() {
    const { formData, errors, handleChange, handleSubmit } = useLoginForm();

    return (
        <div className="min-h-screen bg-[rgb(149,248,165)] dark:bg-[#18351f] flex flex-col justify-center items-center px-5 py-16">

            <section className="bg-[rgb(44,182,78)] dark:bg-[#17652e] text-center w-full max-w-lg py-10 px-5 sm:px-10 box-border rounded-2xl shadow-xl">

                <h1 className="font-display text-2xl sm:text-3xl text-white mb-2">Log in to Raise a Pancho</h1>

                <p className="text-white/90 text-sm mb-6">You need an account to take care of your Pancho.</p>

                <LoginForm
                    formData={formData}
                    errors={errors}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                />

            </section>

            <Link to="/" className="mt-6 underline text-black dark:text-white">Back to Home</Link>
        </div>
    );
}
