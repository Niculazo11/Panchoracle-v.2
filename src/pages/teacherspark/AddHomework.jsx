import { Link } from "react-router-dom";
import FormField from "../../components/FormField.jsx";
import { useAddHomework } from "./useAddHomework.js";
import { HOMEWORK_PATH } from "./teacherPaths.js";

const INPUT_CLASS = "w-full rounded px-3 py-2 bg-[#dddddd] text-black";
const LABEL_CLASS = "block mb-1 font-bold";

// Add-homework page: title, description and due date. Same green as Manage Homework.
export default function AddHomework() {
    const { formData, errors, submitting, handleChange, handleSubmit } = useAddHomework();

    return (
        <main className="flex-1 w-full bg-[#a2b15f] dark:bg-[#4b5a2a] text-black dark:text-white px-5 sm:px-10 py-8 box-border">
            <div className="max-w-2xl mx-auto">
                <Link to={HOMEWORK_PATH} className="underline font-bold">Back to Manage Homework</Link>
                <h2 className="m-0 my-6 text-3xl sm:text-5xl font-extrabold uppercase">Add homework</h2>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    <FormField id="title" label="Title" value={formData.title} onChange={handleChange("title")} error={errors.title} labelClassName={LABEL_CLASS} inputClassName={INPUT_CLASS} errorClassName="block text-red-900 dark:text-red-200 text-sm mt-1" />

                    <div>
                        <label htmlFor="description" className={LABEL_CLASS}>Description</label>
                        <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange("description")} aria-invalid={Boolean(errors.description)} aria-describedby="descriptionError" className={INPUT_CLASS} />
                        <span id="descriptionError" role={errors.description ? "alert" : undefined} className="block text-red-900 dark:text-red-200 text-sm mt-1">{errors.description}</span>
                    </div>

                    <FormField id="dueDate" label="Due date" type="date" value={formData.dueDate} onChange={handleChange("dueDate")} error={errors.dueDate} labelClassName={LABEL_CLASS} inputClassName={INPUT_CLASS} errorClassName="block text-red-900 dark:text-red-200 text-sm mt-1" />

                    <button type="submit" disabled={submitting} className="self-start mt-2 px-10 py-3 bg-[#5a57d9] text-white underline uppercase tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                        {submitting ? "Saving..." : "Add homework"}
                    </button>
                </form>
            </div>
        </main>
    );
}
