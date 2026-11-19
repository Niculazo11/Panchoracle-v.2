import { Link } from "react-router-dom";
import { STUDENTS_PATH } from "./teacherPaths.js";

// Button at the bottom right of the park that opens the list of students (UN-403).
export default function StudentsLink() {
    return (
        <Link
            to={STUDENTS_PATH}
            className="absolute right-4 bottom-4 z-10 px-4 py-2 rounded bg-[#5a57d9] text-white font-bold underline no-underline hover:brightness-110 focus-visible:outline-4 focus-visible:outline-white"
        >
            Students
        </Link>
    );
}
