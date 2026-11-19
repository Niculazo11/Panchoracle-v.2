// Validation of the add-homework form. The server repeats these checks (and also checks
// that the date is inside the period and not used by another assignment).
export const EMPTY_HOMEWORK_FORM = { title: "", description: "", dueDate: "" };
export const EMPTY_HOMEWORK_ERRORS = { title: "", description: "", dueDate: "" };

export function validateHomeworkForm(formData) {
    return {
        title: formData.title.trim() === "" ? "Title is required." : "",
        description: formData.description.trim() === "" ? "Description is required." : "",
        dueDate: formData.dueDate === "" ? "Due date is required." : ""
    };
}

// The date picker gives "2027-03-05"; the API wants an instant. The due time is the end of
// that day in UTC, the same way the classroom period dates are UTC.
export function toApiHomework(formData) {
    return {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueAt: formData.dueDate + "T23:59:00Z"
    };
}
