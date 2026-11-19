import FormField from "../../components/FormField.jsx";

const INPUT_CLASS = "w-full rounded px-3 py-2 bg-[#dddddd] text-black";
const LABEL_CLASS = "block mb-1 font-bold";
const ERROR_CLASS = "block text-red-900 dark:text-red-200 text-sm mt-1";

// Title, description and due date. Used by the add page and the edit page.
export default function HomeworkForm({ formData, errors, submitting, submitLabel, onChange, onSubmit }) {
    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <FormField id="title" label="Title" value={formData.title} onChange={onChange("title")} error={errors.title} labelClassName={LABEL_CLASS} inputClassName={INPUT_CLASS} errorClassName={ERROR_CLASS} />

            <div>
                <label htmlFor="description" className={LABEL_CLASS}>Description</label>
                <textarea id="description" name="description" rows={4} value={formData.description} onChange={onChange("description")} aria-invalid={Boolean(errors.description)} aria-describedby="descriptionError" className={INPUT_CLASS} />
                <span id="descriptionError" role={errors.description ? "alert" : undefined} className={ERROR_CLASS}>{errors.description}</span>
            </div>

            <FormField id="dueDate" label="Due date" type="date" value={formData.dueDate} onChange={onChange("dueDate")} error={errors.dueDate} labelClassName={LABEL_CLASS} inputClassName={INPUT_CLASS} errorClassName={ERROR_CLASS} />

            <button type="submit" disabled={submitting} className="self-start mt-2 px-10 py-3 bg-[#5a57d9] text-white underline uppercase tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "Saving..." : submitLabel}
            </button>
        </form>
    );
}
