import { Link } from "react-router-dom";
import HomeworkRow from "./HomeworkRow.jsx";
import HomeworkDog from "./HomeworkDog.jsx";
import { BackIcon, PlusIcon } from "./HomeworkIcons.jsx";
import { useAssignments } from "./useAssignments.js";
import { PARK_PATH, ADD_HOMEWORK_PATH } from "./teacherPaths.js";

// Manage Homework page (UN-405): one row per assignment, soonest due date first.
// TeacherShell draws the top bar; the dog stays fixed at the bottom of the screen.
export default function ManageHomework() {
    const { status, assignments, error, reload } = useAssignments();

    let content;
    if (status === "loading") {
        content = <p role="status" className="m-0 font-bold">Loading homework...</p>;
    } else if (status === "error") {
        content = (
            <p role="alert" className="m-0 font-bold">
                {error}{" "}
                <button type="button" onClick={reload} className="underline cursor-pointer bg-transparent border-0 font-bold text-inherit">
                    Try again
                </button>
            </p>
        );
    } else if (assignments.length === 0) {
        content = <p role="status" className="m-0 font-bold">No homework yet.</p>;
    } else {
        content = (
            <ul className="m-0 p-0 list-none flex flex-col gap-8">
                {assignments.map((assignment) => (
                    <HomeworkRow key={assignment.id} assignment={assignment} />
                ))}
            </ul>
        );
    }

    return (
        <main className="relative flex-1 w-full bg-[#a2b15f] dark:bg-[#4b5a2a] text-black dark:text-white px-5 sm:px-10 pt-8 pb-64 box-border">
            <div className="relative z-10 max-w-3xl">
                <h2 className="m-0 mb-4 text-3xl sm:text-5xl font-extrabold uppercase">Manage Homework</h2>

                <Link to={ADD_HOMEWORK_PATH} className="inline-flex items-center gap-3 mb-8 text-black dark:text-white font-bold text-lg no-underline">
                    <PlusIcon />
                    Add homework
                </Link>
                {content}
            </div>

            <Link to={PARK_PATH} aria-label="Back to the park" className="absolute top-6 right-5 sm:right-10 z-10 flex items-center justify-center w-14 h-14 rounded-full bg-[#cfe8f5] border-4 border-[#7aa3b8]">
                <BackIcon />
            </Link>

            <HomeworkDog />
        </main>
    );
}
