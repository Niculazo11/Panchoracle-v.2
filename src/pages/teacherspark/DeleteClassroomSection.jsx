import FormField from "../../components/FormField.jsx";
import { useDeleteClassroom } from "./useDeleteClassroom.js";

const INPUT_CLASS = "w-full rounded px-3 py-2 bg-[#dddddd]";
const BUTTON_CLASS = "mt-2 px-10 py-3 bg-[#b91c1c] text-white underline uppercase tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

function unenrollText(count) {
    if (count === null) {
        return "Your students will be unenrolled.";
    }

    if (count === 1) {
        return "1 student will be unenrolled.";
    }

    return `${count} students will be unenrolled.`;
}

// Delete section of the settings page: the teacher must type the classroom name first.
export default function DeleteClassroomSection() {
    const { classroom, confirmText, matches, deleting, studentCount, handleChange, handleDelete } = useDeleteClassroom();

    if (!classroom) {
        return null;
    }

    return (
        <section className="mt-12 p-5 rounded border-2 border-white/70 text-white">
            <h3 className="text-xl mb-2">Delete classroom</h3>
            <p className="mb-2">This cannot be undone. {unenrollText(studentCount)} They keep their Pancho, coins and items.</p>
            <p className="mb-4">Assignments and submissions stay stored but can no longer be opened.</p>

            <form onSubmit={handleDelete} noValidate className="flex flex-col items-center gap-4 text-left">
                <FormField id="confirm" label={`Type “${classroom.name}” to confirm`} value={confirmText} onChange={handleChange} inputClassName={INPUT_CLASS} />

                <button type="submit" disabled={!matches || deleting} className={BUTTON_CLASS}>
                    {deleting ? "Deleting..." : "Delete classroom"}
                </button>
            </form>
        </section>
    );
}
