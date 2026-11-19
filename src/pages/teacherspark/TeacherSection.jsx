import { Link } from "react-router-dom";
import ParkBackground from "./ParkBackground.jsx";
import { PARK_PATH } from "./teacherPaths.js";

// Placeholder of a top-bar tab whose page does not exist yet. It keeps the tab from
// being a dead "#" link and keeps the bar, background and dark mode of the shell.
export default function TeacherSection({ title }) {
    return (
        <ParkBackground>
            <div className="relative z-10 max-w-xl mx-auto mt-12 p-6 text-center rounded-lg bg-white/95 text-black dark:bg-[#14200f]/95 dark:text-white shadow-lg">
                <h2 className="m-0 mb-2 text-3xl font-bold">{title}</h2>
                <p className="m-0 mb-4">This section will be available soon.</p>
                <Link to={PARK_PATH} className="text-[#5a57d9] dark:text-[#c4b5fd] underline">Volver a mis salones</Link>
            </div>
        </ParkBackground>
    );
}
