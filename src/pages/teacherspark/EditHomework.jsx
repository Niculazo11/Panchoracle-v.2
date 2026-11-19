import { Link } from "react-router-dom";
import HomeworkForm from "./HomeworkForm.jsx";
import { useEditHomework } from "./useEditHomework.js";
import { HOMEWORK_PATH } from "./teacherPaths.js";

// Edit-homework page: the same form as the add page, filled with the saved values.
export default function EditHomework() {
    const { status, dateLocked, formData, errors, submitting, handleChange, handleSubmit } = useEditHomework();

    return (
        <main className="flex-1 w-full bg-[#a2b15f] dark:bg-[#4b5a2a] text-black dark:text-white px-5 sm:px-10 py-8 box-border">
            <div className="max-w-2xl mx-auto">
                <Link to={HOMEWORK_PATH} className="underline font-bold">Back to Manage Homework</Link>
                <h2 className="m-0 my-6 text-3xl sm:text-5xl font-extrabold uppercase">Edit homework</h2>

                {status === "loading" && <p role="status" className="m-0 font-bold">Loading homework...</p>}
                {status === "error" && <p role="alert" className="m-0 font-bold">This homework could not be loaded.</p>}
                {status === "ready" && (
                    <HomeworkForm formData={formData} errors={errors} submitting={submitting} submitLabel="Save changes" dateLocked={dateLocked} onChange={handleChange} onSubmit={handleSubmit} />
                )}
            </div>
        </main>
    );
}
