import { Link, Navigate, useLocation } from "react-router-dom";
import LoginForm from "./login/LoginForm.jsx";
import { useAccess } from "../lib/useAccess.js";
import { useState, useCallback } from "react";
import { validateLoginForm, EMPTY_LOGIN_ERRORS } from "../lib/formValidators.js";
import { hasErrors } from "../lib/validation.js";

const EMPTY_FORM = { email: "", password: "" };
const DEFAULT_TARGET = "/raise";

function redirectTarget(state) {
  const from = state && state.from;
  if (!from) return DEFAULT_TARGET;
  if (typeof from === "string") return from;
  return (from.pathname || DEFAULT_TARGET) + (from.search || "");
}

export default function Login() {
  const { status, login } = useAccess();
  const location = useLocation();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_LOGIN_ERRORS);

  // Ya autenticado -> redirige a su Pancho
  if (status === "authenticated") {
    return <Navigate replace to="/raise" />;
  }

  const handleChange = useCallback((field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLoginForm({
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.password
    });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    try {
      await login(formData.email.trim(), formData.password);
      navigate(redirectTarget(location.state), { replace: true });
    } catch (error) {
      setErrors({ email: error.message || "Error al iniciar sesión" });
    }
  };

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