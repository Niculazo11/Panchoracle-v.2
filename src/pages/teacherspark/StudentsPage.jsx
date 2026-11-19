import { useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import ParkBackground from "./ParkBackground.jsx";
import StudentList from "./StudentList.jsx";
import { useStudents } from "./useStudents.js";
import { CLASSROOM_PATH } from "./teacherPaths.js";

// Student list of the classroom (UN-403): one card per enrolled student, kept fresh with
// usePolling. TeacherShell draws the top bar and gives us the classroom and showError.
export default function StudentsPage() {
    const { classroom, showError } = useOutletContext();
    const { students, error, removingId, remove, refresh } = useStudents(classroom.id);

    // Errors after the first load go to the shared banner; the list keeps the last data.
    useEffect(() => {
        showError(students === null ? "" : error);
    }, [error, students, showError]);

    // Clear our message from the banner when the page closes.
    useEffect(() => () => showError(""), [showError]);

    const count = students ? " · " + students.length + (students.length === 1 ? " student" : " students") : "";

    return (
        <ParkBackground>
            <section aria-labelledby="students-title" className="relative z-10 p-4 sm:p-8">
                <Link to={CLASSROOM_PATH} className="inline-block mb-3 px-3 py-1 rounded bg-white/85 text-black dark:bg-black/70 dark:text-white underline">
                    Back to the park
                </Link>
                <h2 id="students-title" className="m-0 mb-4 px-4 py-2 rounded font-display italic text-2xl sm:text-3xl bg-white/80 text-black dark:bg-black/70 dark:text-white">
                    {classroom.name}{count}
                </h2>

                <StudentList
                    students={students}
                    error={error}
                    joinCode={classroom.joinCode}
                    removingId={removingId}
                    onRemove={remove}
                    onRetry={refresh}
                />
            </section>
        </ParkBackground>
    );
}
