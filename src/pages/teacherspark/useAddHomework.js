import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { createAssignment } from "../../lib/assignmentApi.js";
import { hasErrors } from "../../lib/validation.js";
import {
    EMPTY_HOMEWORK_FORM,
    EMPTY_HOMEWORK_ERRORS,
    validateHomeworkForm,
    toApiHomework
} from "./homeworkForm.js";
import { HOMEWORK_PATH } from "./teacherPaths.js";

// State and submit logic of the add-homework page. showError comes from TeacherShell.
export function useAddHomework() {
    const { showError } = useOutletContext();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(EMPTY_HOMEWORK_FORM);
    const [errors, setErrors] = useState(EMPTY_HOMEWORK_ERRORS);
    const [submitting, setSubmitting] = useState(false);

    function handleChange(field) {
        return (event) => {
            const { value } = event.target;
            setFormData((current) => ({ ...current, [field]: value }));
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();
        showError("");

        const nextErrors = validateHomeworkForm(formData);
        setErrors(nextErrors);

        if (hasErrors(nextErrors)) {
            return;
        }

        setSubmitting(true);

        try {
            await createAssignment(toApiHomework(formData));
            navigate(HOMEWORK_PATH);
        } catch (error) {
            // For example PERIOD_LOCKED (the period already started) or a repeated due date.
            showError(error.name === "ApiError" ? error.message : "Could not reach the server.");
            setSubmitting(false);
        }
    }

    return { formData, errors, submitting, handleChange, handleSubmit };
}
