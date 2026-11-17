import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createClassroom } from "../../lib/classroomApi.js";
import { hasErrors } from "../../lib/validation.js";
import {
    EMPTY_CLASSROOM_FORM,
    EMPTY_CLASSROOM_ERRORS,
    validateClassroomForm,
    toApiPeriod
} from "./classroomForm.js";

// State and submit logic of the create-classroom page.
// setClassroom and showError come from TeacherShell (through the Outlet).
export function useNewClassroom() {
    const { setClassroom, showError } = useOutletContext();
    const [formData, setFormData] = useState(EMPTY_CLASSROOM_FORM);
    const [errors, setErrors] = useState(EMPTY_CLASSROOM_ERRORS);
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

        const nextErrors = validateClassroomForm(formData);
        setErrors(nextErrors);

        if (hasErrors(nextErrors)) {
            return;
        }

        const period = toApiPeriod(formData);
        setSubmitting(true);

        try {
            const created = await createClassroom(formData.name.trim(), period.startDate, period.endDate);

            // TeacherShell sees the new classroom and takes the teacher to the park.
            setClassroom(created);
        } catch (error) {
            showError(error.name === "ApiError" ? error.message : "Could not reach the server.");
            setSubmitting(false);
        }
    }

    return { formData, errors, submitting, handleChange, handleSubmit };
}
