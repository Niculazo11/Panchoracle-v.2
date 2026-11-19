import ParkBackground from "./ParkBackground.jsx";
import ParkDog from "./ParkDog.jsx";
import SettingsGearLink from "./SettingsGearLink.jsx";
import StudentsLink from "./StudentsLink.jsx";
import { useParkStudents } from "./useParkStudents.js";

// The park, the main teacher view. TeacherShell draws the top bar around it and makes
// sure the teacher has a classroom. The dogs are the real students' Panchos.
export default function TeachersPark() {
    const { dogs, message } = useParkStudents();

    return (
        <ParkBackground>
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
            <StudentsLink />
        </ParkBackground>
    );
}
