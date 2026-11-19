import { Link } from "react-router-dom";
import SubmissionCard from "./SubmissionCard.jsx";
import { useSubmissions } from "./useSubmissions.js";
import { HOMEWORK_PATH } from "./teacherPaths.js";

// Submitted homework: everything the students handed in for one assignment.
export default function HomeworkSubmissions() {
    const { status, assignment, submissions, error, reload } = useSubmissions();

    let content;
    if (status === "loading") {
        content = <p role="status" className="m-0 font-bold">Loading submitted homework...</p>;
    } else if (status === "error") {
        content = (
            <p role="alert" className="m-0 font-bold">
                {error}{" "}
                <button type="button" onClick={reload} className="underline cursor-pointer bg-transparent border-0 font-bold text-inherit">Try again</button>
            </p>
        );
    } else if (submissions.length === 0) {
        content = <p role="status" className="m-0 font-bold">No submitted homework</p>;
    } else {
        content = (
            <ul className="m-0 p-0 list-none grid gap-4 grid-cols-1 sm:grid-cols-2">
                {submissions.map((submission) => (
                    <SubmissionCard key={submission.id} submission={submission} />
                ))}
            </ul>
        );
    }

    return (
        <main className="flex-1 w-full bg-[#a2b15f] dark:bg-[#4b5a2a] text-black dark:text-white px-5 sm:px-10 py-8 box-border">
            <div className="max-w-3xl mx-auto">
                <Link to={HOMEWORK_PATH} className="underline font-bold">Back to Manage Homework</Link>
                <h2 className="m-0 mt-6 text-3xl sm:text-5xl font-extrabold uppercase">Submitted homework</h2>
                {assignment && <p className="m-0 mt-2 mb-6 text-lg font-bold break-words">{assignment.title}</p>}
                {content}
            </div>
        </main>
    );
}
