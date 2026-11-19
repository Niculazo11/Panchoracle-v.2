import { Link } from "react-router-dom";
import HomeworkForm from "./HomeworkForm.jsx";
import { useAddHomework } from "./useAddHomework.js";
import { HOMEWORK_PATH } from "./teacherPaths.js";

// Add-homework page. Same green as Manage Homework.
export default function AddHomework() {
    const { formData, errors, submitting, handleChange, handleSubmit } = useAddHomework();

    return (
        <main className="flex-1 w-full bg-[#a2b15f] dark:bg-[#4b5a2a] text-black dark:text-white px-5 sm:px-10 py-8 box-border">
            <div className="max-w-2xl mx-auto">
                <Link to={HOMEWORK_PATH} className="underline font-bold">Back to Manage Homework</Link>
                <h2 className="m-0 my-6 text-3xl sm:text-5xl font-extrabold uppercase">Add homework</h2>
                <HomeworkForm formData={formData} errors={errors} submitting={submitting} submitLabel="Add homework" onChange={handleChange} onSubmit={handleSubmit} />
            </div>
        </main>
    );
}
