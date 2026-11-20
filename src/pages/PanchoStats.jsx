import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { usePolling } from "../lib/usePolling.js";
import StatsPanel from "./stats/StatsPanel.jsx";
import { asset } from "../lib/asset.js";

// Profile route: /stats/:username. The registered name in the URL is
// the one stored as student.id (see state/defaults.js), so this page
// is reachable at a shareable, per-student link instead of a single
// fixed path.
export default function PanchoStats() {
    const navigate = useNavigate();
    const { username } = useParams();
    const { dog, student, init } = useGameState();

    // Poll server for state updates (hunger decay, etc.)
    const { refresh } = usePolling(init, { intervalMs: 15000, enabled: true });

    // No Pancho chosen yet -> send the student to pick one first.
    useEffect(() => {
        if (dog && !dog.imgUrl) {
            navigate("/choosePancho.html");
        }
    }, [dog, navigate]);

    // Keep the URL in sync with the registered student: old static
    // links (/stats, /panchoStats.html) or a stale/foreign :username
    // both get canonicalized to this student's own profile URL.
    useEffect(() => {
        if (dog?.imgUrl && student?.id && username !== student.id) {
            navigate(`/stats/${encodeURIComponent(student.id)}`, { replace: true });
        }
    }, [dog?.imgUrl, student?.id, username, navigate]);

    if (!dog?.imgUrl) {
        return null;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#c9a187]">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${asset("images/fondoS.jpeg")}")` }}
            ></div>

            <main className="relative z-10 min-h-screen p-8">

                <h1 className="text-4xl font-bold uppercase text-black">
                    Pancho Stats
                </h1>

                <p className="text-black/70 text-sm mb-4">
                    Profile: <span className="font-semibold">{username || student?.id}</span>
                </p>

                <StatsPanel dog={dog} student={student} />

                <Link to="/raisePancho.html"
                   className="absolute bottom-8 left-8 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#b9d9f0] text-2xl transition hover:scale-110">
                    ➜
                </Link>

            </main>
        </div>
    );
}