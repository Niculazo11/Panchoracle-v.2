import FormField from "../../components/FormField.jsx";
import { useNewClassroom } from "./useNewClassroom.js";
import { MAX_CLASSROOM_NAME_LENGTH } from "./classroomForm.js";

// Create-classroom page. Pastel green background (#CCFFCC, rgb(204, 255, 204)) in light mode, dark
// green in dark mode. Because the background is light, the heading, the labels and the error
// messages use dark green text (white in dark mode); the wide light-gray inputs and the
// purple-blue button with underlined text keep their look.
const INPUT_CLASS = "w-full rounded px-3 py-2 bg-[#dddddd]";
const LABEL_CLASS = "block mb-1 text-[#14391f] dark:text-white";
const ERROR_CLASS = "block text-sm mt-1 text-red-800 dark:text-red-200";

export default function NewClassroom() {
    const { formData, errors, submitting, handleChange, handleSubmit } = useNewClassroom();

    return (
        <main className="flex-1 bg-[#CCFFCC] dark:bg-[#17652e] text-center w-full py-12 px-5 box-border">
            <h2 className="font-display italic uppercase text-4xl sm:text-5xl text-[#14391f] dark:text-white mb-2">New classroom</h2>
            <p className="text-[#14391f] dark:text-white mb-8">Your students will join with a code that is created for you.</p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col items-center gap-4 max-w-2xl mx-auto text-left">
                <FormField id="name" label={`Classroom name (up to ${MAX_CLASSROOM_NAME_LENGTH} characters)`} value={formData.name} onChange={handleChange("name")} error={errors.name} labelClassName={LABEL_CLASS} errorClassName={ERROR_CLASS} inputClassName={INPUT_CLASS} />

                <FormField id="startDate" label="Start date" type="date" value={formData.startDate} onChange={handleChange("startDate")} error={errors.startDate} labelClassName={LABEL_CLASS} errorClassName={ERROR_CLASS} inputClassName={INPUT_CLASS} />

                <FormField id="endDate" label="End date" type="date" value={formData.endDate} onChange={handleChange("endDate")} error={errors.endDate} labelClassName={LABEL_CLASS} errorClassName={ERROR_CLASS} inputClassName={INPUT_CLASS} />

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-4 px-10 py-3 bg-[#5a57d9] text-white underline uppercase tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? "Creating..." : "Create classroom"}
                </button>
            </form>
        </main>
    );
}
