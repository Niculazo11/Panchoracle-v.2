// Label + input + inline error message, reused by every form so the
// markup (and therefore the styling) stays identical across pages.
// The error <span> keeps the original id/classes; its message is only
// rendered when that field actually has an error.
export default function FormField({
    id,
    label,
    type = "text",
    value,
    onChange,
    error,
    wrapperClassName = "w-full",
    labelClassName = "block text-white mb-1",
    inputClassName = "w-full rounded px-3 py-2",
    errorId,
    errorClassName = "block text-red-200 text-sm mt-1"
}) {
    return (
        <div className={wrapperClassName}>
            <label htmlFor={id} className={labelClassName}>{label}</label>

            <input
                type={type}
                id={id}
                name={id}
                className={inputClassName}
                value={value}
                onChange={onChange}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId || id + "Error"}
            />

            <span
                id={errorId || id + "Error"}
                className={errorClassName}
                role={error ? "alert" : undefined}
            >
                {error ? error : ""}
            </span>
        </div>
    );
}
