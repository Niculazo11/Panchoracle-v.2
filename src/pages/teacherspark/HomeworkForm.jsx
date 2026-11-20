import FormField from "../../components/FormField.jsx";
import { todayUtc } from "./homeworkForm.js";

const INPUT_CLASS = "w-full rounded px-3 py-2 bg-[#dddddd] text-black dark:bg-[#2a2a2a] dark:text-white";
const LABEL_CLASS = "block mb-1 font-bold";
const ERROR_CLASS = "block text-red-900 dark:text-red-200 text-sm mt-1";
const TAB = "px-3 py-1 rounded-t border-b-4 font-bold cursor-pointer bg-transparent ";

// Title, description, due date, and optional file. Used by the add page and the edit page.
export default function HomeworkForm({ formData, errors, submitting, submitLabel, dateLocked = false, onChange, onSubmit }) {
    // Derive mode from whether file data is present
    const hasFile = formData.fileName && formData.mimeType && formData.dataBase64;
    const mode = hasFile ? "file" : "link"; // We only have "file" mode for teachers (no link mode)

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <FormField id="title" label="Title" value={formData.title} onChange={onChange("title")} error={errors.title} labelClassName={LABEL_CLASS} inputClassName={INPUT_CLASS} errorClassName={ERROR_CLASS} />

            <div>
                <label htmlFor="description" className={LABEL_CLASS}>Description</label>
                <textarea id="description" name="description" rows={4} value={formData.description} onChange={onChange("description")} aria-invalid={Boolean(errors.description)} aria-describedby="descriptionError" className={INPUT_CLASS} />
                <span id="descriptionError" role={errors.description ? "alert" : undefined} className={ERROR_CLASS}>{errors.description}</span>
            </div>

            <div>
                <label htmlFor="dueDate" className={LABEL_CLASS}>Due date</label>
                <input type="date" id="dueDate" name="dueDate" min={todayUtc()} disabled={dateLocked} value={formData.dueDate} onChange={onChange("dueDate")} aria-invalid={Boolean(errors.dueDate)} aria-describedby="dueDateError" className={INPUT_CLASS + " disabled:opacity-60"} />
                <span id="dueDateError" role={errors.dueDate ? "alert" : undefined} className={ERROR_CLASS}>
                    {errors.dueDate || (dateLocked ? "This homework is already due, so its date cannot change." : "")}
                </span>
            </div>

            {/* File upload section */}
            <div>
                <label className={LABEL_CLASS}>Attachment (optional)</label>
                <div className="space-y-2">
                    <input
                        type="file"
                        id="attachment"
                        name="attachment"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        disabled={submitting || dateLocked}
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) {
                                onChange("fileName")("");
                                onChange("mimeType")("");
                                onChange("dataBase64")("");
                                return;
                            }
                            if (file.size > 3 * 1024 * 1024) {
                                // Set error via form - we'll handle this through the form state
                                onChange("fileName")(file.name);
                                onChange("mimeType")(file.type);
                                // Don't set dataBase64 for too-large files
                                return;
                            }
                            const base64 = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result.split(",")[1]);
                                reader.readAsDataURL(file);
                            });
                            onChange("fileName")(file.name);
                            onChange("mimeType")(file.type);
                            onChange("dataBase64")(base64);
                        }}
                        className={INPUT_CLASS}
                    />
                    {hasFile && (
                        <p className="m-0 text-sm text-green-700 dark:text-green-300">
                            Attached: {formData.fileName} ({Math.round(formData.dataBase64.length * 0.75 / 1024)} KB)
                        </p>
                    )}
                    {errors.fileName && <span role="alert" className={ERROR_CLASS}>{errors.fileName}</span>}
                    <p className="m-0 text-xs text-gray-500 dark:text-gray-400">
                        Max 3 MB. Allowed: JPEG, PNG, WebP, PDF.
                    </p>
                </div>
            </div>

            <button type="submit" disabled={submitting} className="self-start mt-2 px-10 py-3 bg-[#5a57d9] text-white dark:bg-[#c4b5fd] dark:text-[#14200f] underline uppercase tracking-wide cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting ? "Saving..." : submitLabel}
            </button>
        </form>
    );
}
