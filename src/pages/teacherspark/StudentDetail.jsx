import { Link } from "react-router-dom";
import ParkBackground from "./ParkBackground.jsx";
import { useStudentDetail } from "./useStudentDetail.js";
import { STUDENTS_PATH } from "./teacherPaths.js";

// Helper to format date for display
function formatDateForDisplay(dateString) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Status badge component
function StatusBadge({ status }) {
    const classes = {
        submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        graded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
        late: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };
    const base = "inline-block px-2 py-0.5 rounded-full text-xs font-bold capitalize";
    return <span className={base + " " + (classes[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300")}>{status}</span>;
}

// Submission row component
function SubmissionRow({ submission }) {
    const hasFile = Boolean(submission.fileUrl);
    const hasLink = Boolean(submission.linkUrl);

    return (
        <li className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border-2 bg-white/50 dark:bg-[#1a1a1a] border-[#7c3aed]/30 dark:border-[#a855f7]/30">
            <div className="flex-1 min-w-0">
                <h4 className="m-0 text-base font-bold text-black dark:text-white truncate">{submission.assignmentTitle}</h4>
                <p className="m-0 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Due: {formatDateForDisplay(submission.dueDate)}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <StatusBadge status={submission.status} />
                <time className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                    Submitted: {formatDateForDisplay(submission.submittedAt)}
                </time>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                {submission.grade !== null && submission.grade !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        Grade: {submission.grade}%
                    </span>
                )}

                {hasFile && (
                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded border-2 border-[#7c3aed] text-[#5a57d9] dark:text-[#c4b5fd] font-bold text-sm hover:bg-[#7c3aed]/10 transition-colors">
                        📎 File
                    </a>
                )}

                {hasLink && (
                    <a href={submission.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded border-2 border-[#06b6d4] text-[#0891b2] dark:text-[#67e8f9] font-bold text-sm hover:bg-[#06b6d4]/10 transition-colors">
                        🔗 Link
                    </a>
                )}

                {!hasFile && !hasLink && submission.status === "submitted" && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">No file or link attached</span>
                )}
            </div>
        </li>
    );
}

export default function StudentDetail() {
    const { status, student, submissions, error, reload } = useStudentDetail();

    // Loading state
    if (status === "loading") {
        return (
            <ParkBackground>
                <section aria-labelledby="detail-title" className="relative z-10 p-4 sm:p-8">
                    <p role="status" className="m-0 font-bold text-center py-12">Loading student details...</p>
                </section>
            </ParkBackground>
        );
    }

    // Error state
    if (status === "error") {
        return (
            <ParkBackground>
                <section aria-labelledby="detail-title" className="relative z-10 p-4 sm:p-8">
                    <div role="alert" className="m-0 p-4 rounded font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-center">
                        {error}{" "}
                        <button type="button" onClick={reload} className="underline cursor-pointer bg-transparent border-0 font-bold">
                            Try again
                        </button>
                    </div>
                </section>
            </ParkBackground>
        );
    }

    // Student not found (shouldn't happen with 404, but defensive)
    if (!student) {
        return (
            <ParkBackground>
                <section aria-labelledby="detail-title" className="relative z-10 p-4 sm:p-8">
                    <div role="alert" className="m-0 p-4 rounded font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-center">
                        Student not found.
                    </div>
                </section>
            </ParkBackground>
        );
    }

    return (
        <ParkBackground>
            <section aria-labelledby="detail-title" className="relative z-10 p-4 sm:p-8">
                <Link to={STUDENTS_PATH} className="inline-block mb-4 px-3 py-1 rounded bg-white/85 text-black dark:bg-black/70 dark:text-white underline hover:opacity-80 transition-opacity">
                    ← Back to students
                </Link>

                <header className="mb-6">
                    <h2 id="detail-title" className="m-0 text-2xl sm:text-3xl font-display italic text-black dark:text-white">
                        {student.name}
                    </h2>
                    <p className="m-0 mt-1 text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                </header>

                <div className="space-y-4">
                    <h3 className="m-0 text-lg font-bold text-black dark:text-white">Submission History</h3>

                    {submissions.length === 0 ? (
                        <div role="status" className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                            <p className="m-0 text-gray-600 dark:text-gray-400">No submissions yet.</p>
                        </div>
                    ) : (
                        <ul className="m-0 p-0 list-none flex flex-col gap-4" role="list">
                            {submissions.map((submission) => (
                                <SubmissionRow key={submission.id} submission={submission} />
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </ParkBackground>
    );
}