// Validation of the add-homework form. The server repeats these checks (and also checks
// that the date is inside the period and not used by another assignment).
export const EMPTY_HOMEWORK_FORM = { title: "", description: "", dueDate: "" };
export const EMPTY_HOMEWORK_ERRORS = { title: "", description: "", dueDate: "" };

// Today as "YYYY-MM-DD" in UTC, the same clock the due dates use (they end at 23:59 UTC).
export function todayUtc() {
    return new Date().toISOString().slice(0, 10);
}

// `original` is the saved assignment when editing: its date is only checked if it changed.
export function validateHomeworkForm(formData, original = null) {
    const dateChanged = !original || formData.dueDate !== original.dueAt.slice(0, 10);
    let dueDate = "";

    if (formData.dueDate === "") {
        dueDate = "Due date is required.";
    } else if (dateChanged && formData.dueDate < todayUtc()) {
        dueDate = "The due date cannot be before today.";
    }

    return {
        title: formData.title.trim() === "" ? "Title is required." : "",
        description: formData.description.trim() === "" ? "Description is required." : "",
        dueDate
    };
}

// A homework that is already due keeps its date (the server does not allow changing it).
export function isDue(assignment) {
    return new Date(assignment.dueAt).getTime() <= Date.now();
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

// Form values of an assignment that already exists (the date picker wants "YYYY-MM-DD").
export function fromApiHomework(assignment) {
    return {
        title: assignment.title,
        description: assignment.description || "",
        dueDate: assignment.dueAt.slice(0, 10)
    };
}

// Only what changed. The due date is left out when the day is the same, so editing the
// text never touches the date (the server checks dates more strictly than text).
export function toApiChanges(formData, original) {
    const changes = {};
    const next = toApiHomework(formData);

    if (next.title !== original.title) {
        changes.title = next.title;
    }
    if (next.description !== (original.description || "")) {
        changes.description = next.description;
    }
    if (formData.dueDate !== original.dueAt.slice(0, 10)) {
        changes.dueAt = next.dueAt;
    }

    return changes;
}
