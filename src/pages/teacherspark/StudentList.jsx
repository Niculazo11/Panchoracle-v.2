import StudentCard from "./StudentCard.jsx";

const PANEL = "m-0 px-4 py-2 rounded font-bold bg-white/80 text-black dark:bg-black/70 dark:text-white";

// The grid of cards and its loading, error and empty states.
// `students` is null until the first answer arrives.
export default function StudentList({ students, error, joinCode, removingId, onRemove, onRetry }) {
    if (students === null && error) {
        return (
            <div role="alert" className={PANEL}>
                {error}{" "}
                <button type="button" onClick={onRetry} className="underline cursor-pointer bg-transparent border-0 font-bold">
                    Try again
                </button>
            </div>
        );
    }

    if (students === null) {
        return <p role="status" className={PANEL}>Loading students...</p>;
    }

    if (students.length === 0) {
        return (
            <p role="status" className={PANEL}>
                No students yet. Share the join code <span className="font-mono tracking-widest">{joinCode}</span> so they can join.
            </p>
        );
    }

    return (
        <ul className="m-0 p-0 list-none grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
                <StudentCard
                    key={student.id}
                    student={student}
                    removing={removingId === student.id}
                    onRemove={() => onRemove(student.id)}
                />
            ))}
        </ul>
    );
}
