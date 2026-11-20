import FormField from "../../components/FormField.jsx";
import { getStoredUsername } from "../../lib/dogApi.js";
import { useJoinForm } from "./useJoinForm.js";

export default function JoinSection() {
    const { formData, errors, formSuccessText, submitting, handleChange, handleSubmit, handleJoin } = useJoinForm();

    const savedName = getStoredUsername();
    const welcomeMessage = savedName ? `Welcome back, ${savedName}!` : "Join Raise a Pancho";

    return (
        <section className=" bg-[rgb(44,182,78)] dark:bg-[#17652e] text-center w-full py-16 px-5 md:px-[100px] box-border">
            <h2 id="welcomeMessage" className="font-display text-2xl sm:text-3xl text-white mb-6">{welcomeMessage}</h2>

            <form id="joinForm" onSubmit={handleSubmit} noValidate className="flex flex-col items-center gap-4 max-w-md mx-auto text-left">

                <FormField id="name" label="Name:" value={formData.name} onChange={handleChange("name")} error={errors.name} />

                <FormField id="email" label="Email:" type="email" value={formData.email} onChange={handleChange("email")} error={errors.email} />

                <FormField id="password" label="Password:" type="password" value={formData.password} onChange={handleChange("password")} error={errors.password} />

                <div className="w-full">
                    <p className="text-white mb-2">Join as:</p>
                    <div className="flex gap-4">
                        <button type="button" disabled={submitting} onClick={() => handleJoin("teacher")} aria-pressed={formData.role === "teacher"} className={`flex-1 px-5 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed ${formData.role === "teacher" ? "bg-green-900 ring-2 ring-white" : "bg-[rgb(21,116,62)] dark:bg-[#5d7467]"}`}>Teacher</button>
                        <button type="button" disabled={submitting} onClick={() => handleJoin("student")} aria-pressed={formData.role === "student"} className={`flex-1 px-5 py-2 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed ${formData.role === "student" ? "bg-green-900 ring-2 ring-white" : "bg-[rgb(21,116,62)] dark:bg-[#5d7467]"}`}>Student</button>
                    </div>
                </div>

                <button type="submit" disabled={submitting} className="w-full px-5 py-3 bg-white text-green-800 font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? "Creating account..." : "Create Account"}</button>

                {/* Kept hidden exactly like the original #formSuccess paragraph. */}
                <p id="formSuccess" className="hidden text-white font-semibold">{formSuccessText}</p>

            </form>
        </section>
    );
}
