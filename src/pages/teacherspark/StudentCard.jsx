import { Link } from "react-router-dom";
import StudentAvatar from "./StudentAvatar.jsx";
import StudentStats from "./StudentStats.jsx";
import RemoveStudent from "./RemoveStudent.jsx";
import { studentPath } from "./teacherPaths.js";

// One student of the classroom: name, ALIVE / DEAD badge, bars and actions (UN-403).
export default function StudentCard({ student, removing, onRemove }) {
    const dead = student.pet?.status === "dead";
    const badge = dead
        ? "bg-red-700 text-white"
        : "bg-emerald-600 text-white";

    return (
        <li className={"flex flex-col gap-3 p-4 rounded-lg border-4 text-black dark:text-white " + (dead
            ? "bg-gray-300 border-red-700 dark:bg-gray-700 dark:border-red-400"
            : "bg-white/90 border-[#7c3aed] dark:bg-[#2a2a2a] dark:border-[#a855f7]")}>
            <div className="flex items-center gap-3">
                <StudentAvatar student={student} dead={dead} />
                <div className="min-w-0">
                    <h3 className="m-0 text-lg font-bold break-words">{student.name}</h3>
                    {student.pet && (
                        <span className={"inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold " + badge}>
                            {dead ? "DEAD" : "ALIVE"}
                        </span>
                    )}
                </div>
            </div>

            <StudentStats pet={student.pet} />

            <div className="flex flex-wrap items-center justify-between gap-2">
                <Link to={studentPath(student.id)} className="underline font-bold text-[#5a57d9] dark:text-[#c4b5fd]">
                    View details
                </Link>
                <RemoveStudent name={student.name} busy={removing} onConfirm={onRemove} />
            </div>
        </li>
    );
}
