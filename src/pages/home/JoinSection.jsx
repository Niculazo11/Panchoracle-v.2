import FormField from "../../components/FormField.jsx";
import { getStoredUsername } from "../../lib/dogApi.js";
import { useJoinForm } from "./useJoinForm.js";

export default function JoinSection() {
    const { formData, errors, formSuccessText, handleChange, handleSubmit } = useJoinForm();

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
                    <label htmlFor="message" className="block text-white mb-1">Are you a student or a teacher?</label>
                    <textarea id="message" name="message" className="w-full rounded px-3 py-2" value={formData.message} onChange={handleChange("message")}></textarea>
                </div>

                <button type="submit" className="inline-block px-5 py-2 bg-[rgb(21,116,62)] dark:bg-[#5d7467] text-white rounded">Join us</button>

                {/* Kept hidden exactly like the original #formSuccess paragraph. */}
                <p id="formSuccess" className="hidden text-white font-semibold">{formSuccessText}</p>

            </form>
        </section>
    );
}
