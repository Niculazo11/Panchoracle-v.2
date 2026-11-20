import SubmitForm from "./SubmitForm.jsx";

function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" });
}

// Only web links are opened, whatever the server sent.
function safeHref(url) {
    return /^https?:\/\//.test(url) || url.startsWith("/api/") ? url : undefined;
}

// One assignment of the list: open (can be handed in), handed in, or expired.
export default function HomeworkItem({ assignment, submission, onSubmitted }) {
    const expired = new Date(assignment.dueAt) <= new Date();
    const state = submission ? "Handed in" : expired ? "Expired" : "Open";
    const badge = submission ? "bg-emerald-600" : expired ? "bg-red-700" : "bg-[#5a57d9]";

    return (
        <li className="p-4 rounded-lg border-2 border-black/20 bg-white text-black dark:bg-[#14200f]/95 dark:text-white dark:border-white/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0 text-lg font-bold break-words">{assignment.title}</h2>
                <span className={"px-2 py-0.5 rounded-full text-xs font-bold text-white " + badge}>{state}</span>
            </div>
            <p className="m-0 mt-1 text-sm break-words">{assignment.description}</p>
            <p className="m-0 mt-1 text-xs opacity-70">Due {formatDate(assignment.dueAt)}</p>

            {submission && (
                <p className="m-0 mt-2 text-sm">
                    Sent: <a href={safeHref(submission.fileUrl)} target="_blank" rel="noopener noreferrer" className="underline text-[#5a57d9] dark:text-[#c4b5fd] break-all">{submission.fileName}</a>
                </p>
            )}
            {!submission && !expired && <SubmitForm assignmentId={assignment.id} onDone={onSubmitted} />}
        </li>
    );
}
