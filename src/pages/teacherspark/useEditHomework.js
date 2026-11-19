import { useState, useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getAssignment, updateAssignment } from "../../lib/assignmentApi.js";
import { hasErrors } from "../../lib/validation.js";
import { EMPTY_HOMEWORK_FORM, EMPTY_HOMEWORK_ERRORS, validateHomeworkForm, fromApiHomework, toApiChanges, isDue } from "./homeworkForm.js";
import { HOMEWORK_PATH } from "./teacherPaths.js";

// State and submit logic of the edit-homework page. showError comes from TeacherShell.
export function useEditHomework() {
    const { assignmentId } = useParams();
    const { showError } = useOutletContext();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading");
    const [original, setOriginal] = useState(null);
    const [formData, setFormData] = useState(EMPTY_HOMEWORK_FORM);
    const [errors, setErrors] = useState(EMPTY_HOMEWORK_ERRORS);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setStatus("loading");

        getAssignment(assignmentId, controller.signal)
            .then((assignment) => {
                setOriginal(assignment);
                setFormData(fromApiHomework(assignment));
                setStatus("ready");
            })
            .catch((error) => {
                if (error.name !== "AbortError") {
                    setStatus("error");
                }
            });

        // Cleanup: cancel the request if the page closes first.
        return () => controller.abort();
    }, [assignmentId]);

    function handleChange(field) {
        return (event) => {
            const { value } = event.target;
            setFormData((current) => ({ ...current, [field]: value }));
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();
        showError("");

        const nextErrors = validateHomeworkForm(formData, original);
        setErrors(nextErrors);

        if (hasErrors(nextErrors)) {
            return;
        }

        const changes = toApiChanges(formData, original);

        if (Object.keys(changes).length === 0) {
            navigate(HOMEWORK_PATH);
            return;
        }

        setSubmitting(true);

        try {
            await updateAssignment(assignmentId, changes);
            navigate(HOMEWORK_PATH);
        } catch (error) {
            showError(error.name === "ApiError" ? error.message : "Could not reach the server.");
            setSubmitting(false);
        }
    }

    const dateLocked = original !== null && isDue(original);

    return { status, dateLocked, formData, errors, submitting, handleChange, handleSubmit };
}
