import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { GameState } from "../state/gameState.js";
import StatsPanel from "./stats/StatsPanel.jsx";

export default function PanchoStats() {
    const navigate = useNavigate();
    const { dog, student, currentAssignment } = useGameState();

    // No Pancho chosen yet -> send the student to pick one first.
    useEffect(() => {
        if (!dog.imgUrl) {
            navigate("/choosePancho.html");
        }
    }, [dog.imgUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // Keep this page's numbers live even if the passive hunger/health
    // tick (running on RaisePancho in another tab) writes to localStorage
    // while this page is open.
    useEffect(() => {
        function handleStorage(event) {
            if (event.key && event.key.indexOf("panchoGameState_") === 0) {
                GameState.init();
            }
        }

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    if (!dog.imgUrl) {
        return null;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#c9a187]">
            <div className="absolute inset-0 bg-[url('/images/fondoS.jpeg')] bg-cover bg-center bg-no-repeat"></div>

            <main className="relative z-10 min-h-screen p-8">

                <h1 className="text-4xl font-bold uppercase text-black">
                    Pancho Stats
                </h1>

                <StatsPanel dog={dog} student={student} currentAssignment={currentAssignment} />

                <a href="/raisePancho.html"
                   className="absolute bottom-8 left-8 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#b9d9f0] text-2xl transition hover:scale-110">
                    ➜
                </a>

            </main>
        </div>
    );
}
