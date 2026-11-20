import { Link } from "react-router-dom";
import ParkBackground from "./ParkBackground.jsx";
import ParkDog from "./ParkDog.jsx";
import SettingsGearLink from "./SettingsGearLink.jsx";
import { BackIcon } from "./HomeworkIcons.jsx";
import { useParkStudents } from "./useParkStudents.js";
import { NEW_CLASSROOM_PATH } from "./teacherPaths.js";

// The park, the main teacher view. TeacherShell draws the top bar around it and makes
// sure the teacher has a classroom. The dogs are the real students' Panchos.
export default function TeachersPark() {
    const { dogs, message } = useParkStudents();

    return (
        <ParkBackground>
            <Link
                to={NEW_CLASSROOM_PATH}
                aria-label="Back to create classroom"
                className="absolute top-6 left-5 sm:left-10 z-10 flex items-center justify-center w-14 h-14 rounded-full bg-[#cfe8f5] border-4 border-[#7aa3b8]"
            >
                <BackIcon />
            </Link>

            {dogs.map((dog) => (
                <ParkDog key={dog.student.id} dog={dog} />
            ))}

            {message && (
                <p
                    role="status"
                    className="absolute left-1/2 top-8 -translate-x-1/2 m-0 px-4 py-2 rounded font-bold bg-white/85 text-black dark:bg-black/70 dark:text-white"
                >
                    {message}
                </p>
            )}

            <SettingsGearLink />
        </ParkBackground>
    );
}
