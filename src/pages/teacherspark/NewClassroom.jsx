import FormField from "../../components/FormField.jsx";
import { useNewClassroom } from "./useNewClassroom.js";
import { MAX_CLASSROOM_NAME_LENGTH } from "./classroomForm.js";

// Create-classroom page. Same look as the sign-up section: green background, white
// labels over wide light-gray inputs and a purple-blue button with underlined text.
const INPUT_CLASS = "w-full rounded px-3 py-2 bg-[#dddddd]";

export default function NewClassroom() {
    const { formData, errors, submitting, handleChange, handleSubmit } = useNewClassroom();

    return (
        <main className="flex-1 bg-[rgb(44,182,78)] dark:bg-[#17652e] text-center w-full py-12 px-5 box-border">
            <h2 className="font-display italic uppercase text-4xl sm:text-5xl text-white mb-2">New classroom</h2>
            <p className="text-white mb-8">Your students will join with a code that is created for you.</p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col items-center gap-4 max-w-2xl mx-auto text-left">
                <FormField id="name" label={`Classroom name (up to ${MAX_CLASSROOM_NAME_LENGTH} characters)`} value={formData.name} onChange={handleChange("name")} error={errors.name} inputClassName={INPUT_CLASS} />

                <FormField id="startDate" label="Start date" type="date" value={formData.startDate} onChange={handleChange("startDate")} error={errors.startDate} inputClassName={INPUT_CLASS} />

                <FormField id="endDate" label="End date" type="date" value={formData.endDate} onChange={handleChange("endDate")} error={errors.endDate} inputClassName={INPUT_CLASS} />

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
