import { useState } from "react";
import { Navigate, Outlet, useMatch } from "react-router-dom";
import { useMyClassroom } from "../../hooks/useMyClassroom.js";
import ErrorBanner from "../../components/ErrorBanner.jsx";
import TeachersParkNav from "./TeachersParkNav.jsx";
import ParkBackground from "./ParkBackground.jsx";
import { PARK_PATH, NEW_CLASSROOM_PATH } from "./teacherPaths.js";

// Layout of every /teachersPark page: error banner, top bar and the page itself.
// It loads the teacher's classroom once and gives it to the pages through the Outlet.
// A page reads it with useOutletContext(): { classroom, setClassroom, showError }.
export default function TeacherShell() {
    const { status, classroom, error, setClassroom, reload } = useMyClassroom();
    const [pageError, setPageError] = useState("");
    const onCreatePage = useMatch(NEW_CLASSROOM_PATH) !== null;
    const onPanel = useMatch({ path: PARK_PATH, end: true }) !== null;

    // Once we know, send the teacher to the right place. Without a classroom the panel
    // shows its empty state ("Aún no tienes salones") with a button to create one.
    if (status === "ready" && !classroom && !onCreatePage && !onPanel) {
        return <Navigate to={PARK_PATH} replace />;
    }
    if (status === "ready" && classroom && onCreatePage) {
        return <Navigate to={PARK_PATH} replace />;
    }

    let content;
    if (status === "loading") {
        content = (
            <ParkBackground>
                <p
                    role="status"
                    className="absolute left-1/2 top-8 -translate-x-1/2 m-0 px-4 py-2 rounded font-bold bg-white/80 text-black dark:bg-black/70 dark:text-white"
                >
                    Loading...
                </p>
            </ParkBackground>
        );
    } else if (status === "error") {
        content = <ParkBackground />;
    } else {
        content = <Outlet context={{ classroom, setClassroom, showError: setPageError }} />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#c9d8a4] dark:bg-[#1a3d1a]">
            <ErrorBanner
                message={error || pageError}
                onRetry={error ? reload : undefined}
                onClose={error ? undefined : () => setPageError("")}
            />
            <TeachersParkNav />
            {content}
        </div>
    );
}
