// Validation of the add-homework form. The server repeats these checks (and also checks
// that the date is inside the period and not used by another assignment).
export const EMPTY_HOMEWORK_FORM = { title: "", description: "", dueDate: "", fileName: "", mimeType: "", dataBase64: "" };
export const EMPTY_HOMEWORK_ERRORS = { title: "", description: "", dueDate: "", fileName: "", mimeType: "", dataBase64: "" };

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
        dueDate,
        fileName: "",
        mimeType: "",
        dataBase64: ""
    };
}

// A homework that is already due keeps its date (the server does not allow changing it).
export function isDue(assignment) {
    return new Date(assignment.dueAt).getTime() <= Date.now();
}

// The date picker gives "2027-03-05"; the API wants an instant. The due time is the end of
// that day in UTC, the same way the classroom period dates are UTC.
export function toApiHomework(formData) {
    const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueAt: formData.dueDate + "T23:59:00Z"
    };

    // Include file data if provided
    if (formData.fileName && formData.mimeType && formData.dataBase64) {
        payload.fileName = formData.fileName;
        payload.mimeType = formData.mimeType;
        payload.dataBase64 = formData.dataBase64;
    }

    return payload;
}

// Form values of an assignment that already exists (the date picker wants "YYYY-MM-DD").
export function fromApiHomework(assignment) {
    return {
        title: assignment.title,
        description: assignment.description || "",
        dueDate: assignment.dueAt.slice(0, 10),
        fileName: "",
        mimeType: "",
        dataBase64: ""
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

    // Include file fields if they changed (teacher wants to add/replace/remove file)
    if (formData.fileName !== undefined || formData.mimeType !== undefined || formData.dataBase64 !== undefined) {
        changes.fileName = formData.fileName || "";
        changes.mimeType = formData.mimeType || "";
        changes.dataBase64 = formData.dataBase64 || "";
    }

    return changes;
}
