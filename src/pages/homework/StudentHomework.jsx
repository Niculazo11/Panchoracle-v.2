import { Link } from "react-router-dom";
import HomeworkItem from "./HomeworkItem.jsx";
import { useStudentHomework } from "./useStudentHomework.js";

// Student page: the whole list of assignments, in any order. A student can hand in the
// ones they want; the ones that expire without a submission cost Pancho health (ADR 5.3).
export default function StudentHomework() {
    const { status, assignments, submissions, error, reload, addSubmission } = useStudentHomework();

    let content;
    if (status === "loading") {
        content = <p role="status" className="m-0 font-bold">Loading homework...</p>;
    } else if (status === "error") {
        content = (
            <p role="alert" className="m-0 font-bold">
                {error}{" "}
                <button type="button" onClick={reload} className="underline cursor-pointer bg-transparent border-0 font-bold text-inherit">Try again</button>
            </p>
        );
    } else if (assignments.length === 0) {
        content = <p role="status" className="m-0 font-bold">Your teacher has not added homework yet.</p>;
    } else {
        content = (
            <ul className="m-0 p-0 list-none flex flex-col gap-4">
                {assignments.map((assignment) => (
                    <HomeworkItem
                        key={assignment.id}
                        assignment={assignment}
                        submission={submissions.find((s) => s.assignmentId === assignment.id)}
                        onSubmitted={addSubmission}
                    />
                ))}
            </ul>
        );
    }

    return (
        <main className="min-h-screen bg-[oklch(90.1%_0.076_70.697)] text-black px-5 sm:px-10 py-8 box-border">
            <div className="max-w-2xl mx-auto">
                <Link to="/raise" className="underline font-bold">Back to Pancho</Link>
                <h1 className="m-0 my-6 text-3xl sm:text-5xl font-bold">Homework</h1>
                {content}
            </div>
        </main>
    );
}
