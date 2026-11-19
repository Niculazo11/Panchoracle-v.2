import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccess } from "../../lib/useAccess.js";
import { asset } from "../../lib/asset.js";

const STUDENT_MESSAGE = "Only teachers can access this option.";

// "Enter Our Dog Park" is teacher-only. A student gets a message instead of being sent
// through /teachersPark -> /login -> /raise -> /choosePancho (which asked for a class code).
export default function DogParkCard() {
    const { role } = useAccess();
    const [blocked, setBlocked] = useState(false);

    const image = (
        <img src={asset("images/perrosX2.png")} alt="Panchos sitting and looking at the camera." className="w-[90%] max-w-[300px] rounded-[20px] block mx-auto" />
    );

    return (
        <article className="flex-1 text-center">
            <h2 className="text-xl font-normal mb-[25px]">Enter Our Dog Park</h2>
            {role === "student" ? (
                <>
                    <button type="button" onClick={() => setBlocked(true)} className="bg-transparent border-0 p-0 cursor-pointer">
                        {image}
                    </button>
                    {blocked && (
                        <p role="alert" className="mt-4 font-semibold text-red-700 dark:text-red-300">{STUDENT_MESSAGE}</p>
                    )}
                </>
            ) : (
                <Link to="/teachersPark">{image}</Link>
            )}
        </article>
    );
}
