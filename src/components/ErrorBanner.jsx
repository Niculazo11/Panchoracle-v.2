// Red banner shown at the top of the page for server errors (UN-401 RF-16).
// Shows nothing when there is no message.
export default function ErrorBanner({ message, onRetry, onClose }) {
    if (!message) {
        return null;
    }

    const buttonClass = "px-3 py-1 rounded border-2 border-current font-bold bg-transparent cursor-pointer";

    return (
        <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3 bg-red-100 text-red-900 border-b-4 border-red-600 dark:bg-red-950 dark:text-red-100 dark:border-red-400"
        >
            <p className="m-0 font-bold">{message}</p>

            <div className="flex gap-2">
                {onRetry && (
                    <button type="button" onClick={onRetry} className={buttonClass}>
                        Try again
                    </button>
                )}
                {onClose && (
                    <button type="button" onClick={onClose} aria-label="Dismiss error" className={buttonClass}>
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}
