import { Link, useOutletContext } from "react-router-dom";
import ParkBackground from "./ParkBackground.jsx";
import ClassroomCard from "./ClassroomCard.jsx";
import { NEW_CLASSROOM_PATH } from "./teacherPaths.js";

// ADR 5.6: a teacher administers a single classroom (unique teacherId), so a second
// "Create classroom" would answer 409. The button stays visible but disabled at the limit.
const MAX_CLASSROOMS = 1;
const BUTTON_CLASS = "min-h-11 inline-flex items-center px-6 py-2 bg-[#5a57d9] text-white underline uppercase tracking-wide rounded no-underline";

// Teacher panel (UN-401). TeacherShell loads the classroom of the logged-in teacher
// from GET /api/classrooms/me, so only that teacher's classrooms are ever shown.
export default function ClassroomsPanel() {
    const { classroom, showError } = useOutletContext();
    const classrooms = classroom ? [classroom] : [];
    const atLimit = classrooms.length >= MAX_CLASSROOMS;

    return (
        <ParkBackground>
            <div className="relative z-10 w-full max-w-3xl mx-auto p-4 sm:p-8 box-border">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-4 py-3 rounded-lg bg-white/90 text-black dark:bg-[#14200f]/90 dark:text-white">
                    <h2 className="m-0 text-3xl font-bold">My classrooms</h2>
                    {atLimit ? (
                        <button type="button" disabled aria-describedby="limit-note" className={BUTTON_CLASS + " opacity-60 cursor-not-allowed"}>
                            Create classroom
                        </button>
                    ) : (
                        <Link to={NEW_CLASSROOM_PATH} className={BUTTON_CLASS}>Create classroom</Link>
                    )}
                    {atLimit && (
                        <p id="limit-note" className="m-0 basis-full text-sm opacity-80">
                            For now, each teacher can have only one classroom.
                        </p>
                    )}
                </div>

                {classrooms.length === 0 ? (
                    <section className="rounded-lg p-6 text-center bg-white/95 text-black dark:bg-[#14200f]/95 dark:text-white shadow-lg">
                        <h3 className="m-0 mb-2 text-2xl font-bold">You don't have any classrooms yet</h3>
                        <p className="m-0 mb-4">Create your first classroom so your students can join with a code.</p>
                        <Link to={NEW_CLASSROOM_PATH} className={BUTTON_CLASS}>Create classroom</Link>
                    </section>
                ) : (
                    <ul className="m-0 p-0 list-none flex flex-col gap-4">
                        {classrooms.map((item) => (
                            <li key={item.id}>
                                <ClassroomCard classroom={item} onCopyError={showError} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </ParkBackground>
    );
}
