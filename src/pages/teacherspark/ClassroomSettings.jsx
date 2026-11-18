import { Link } from "react-router-dom";
import FormField from "../../components/FormField.jsx";
import JoinCodeBox from "./JoinCodeBox.jsx";
import DeleteClassroomSection from "./DeleteClassroomSection.jsx";
import { useClassroomSettings } from "./useClassroomSettings.js";
import { MAX_CLASSROOM_NAME_LENGTH } from "./classroomForm.js";
import { PARK_PATH } from "./teacherPaths.js";

// Classroom settings page. Same look as the create page: green background, white labels
// over light-gray inputs and a purple-blue button. The delete section sits at the bottom.
const INPUT_CLASS = "w-full rounded px-3 py-2 bg-[#dddddd]";
const BUTTON_CLASS = "mt-2 px-10 py-3 bg-[#5a57d9] text-white underline uppercase tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

export default function ClassroomSettings() {
    const { classroom, name, error, saving, saved, unchanged, showError, handleChange, handleSubmit } = useClassroomSettings();

    if (!classroom) {
        return null;
    }

    return (
        <main className="flex-1 bg-[rgb(44,182,78)] dark:bg-[#17652e] w-full py-12 px-5 box-border">
            <div className="max-w-2xl mx-auto">
                <Link to={PARK_PATH} className="text-white underline">Back to the park</Link>

                <h2 className="font-display italic uppercase text-4xl sm:text-5xl text-white text-center my-6">Classroom settings</h2>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col items-center gap-4 text-left">
                    <FormField id="name" label={`Classroom name (up to ${MAX_CLASSROOM_NAME_LENGTH} characters)`} value={name} onChange={handleChange} error={error} inputClassName={INPUT_CLASS} />

                    <button type="submit" disabled={saving || unchanged} className={BUTTON_CLASS}>
                        {saving ? "Saving..." : "Save name"}
                    </button>

                    {saved && <p role="status" className="m-0 text-white font-bold">Name saved.</p>}
                </form>

                <JoinCodeBox code={classroom.joinCode} onCopyError={showError} />

                <DeleteClassroomSection />
            </div>
        </main>
    );
}
