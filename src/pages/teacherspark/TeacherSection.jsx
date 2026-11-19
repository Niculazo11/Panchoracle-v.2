import { useNavigate } from "react-router-dom";
import ParkBackground from "./ParkBackground.jsx";

// Placeholder of a top-bar tab whose page does not exist yet. It keeps the tab from
// being a dead "#" link and keeps the bar, background and dark mode of the shell.
export default function TeacherSection({ title }) {
    const navigate = useNavigate();

    return (
        <ParkBackground>
            <div className="relative z-10 max-w-xl mx-auto mt-12 p-6 text-center rounded-lg bg-white/95 text-black dark:bg-[#14200f]/95 dark:text-white shadow-lg">
                <h2 className="m-0 mb-2 text-3xl font-bold">{title}</h2>
                <p className="m-0 mb-4">This section will be available soon.</p>
<<<<<<< HEAD
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="text-[#5a57d9] dark:text-[#c4b5fd] underline hover:no-underline bg-transparent border-0 cursor-pointer"
                >
                    Back to classrooms
                </button>
=======
                <Link to={PARK_PATH} className="text-[#5a57d9] dark:text-[#c4b5fd] underline">Back to my classrooms</Link>
>>>>>>> e6c418d95cc5af372969f51ec3e3948ace91c04f
            </div>
        </ParkBackground>
    );
}
