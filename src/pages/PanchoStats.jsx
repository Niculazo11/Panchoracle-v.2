import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { DEAD_STATUS_MESSAGE, GameState } from "../state/gameState.js";

const TOTAL_ASSIGNMENT_STEPS = 4;

function formatCoins(n) {
    return n.toLocaleString("en-US");
}

export default function PanchoStats() {
    const navigate = useNavigate();
    const { dog, student, currentAssignment } = useGameState();

    // No Pancho chosen yet -> send the student to pick one first (same
    // guard dashboard.js uses on raisePancho.html).
    useEffect(() => {
        if (!dog.imgUrl) {
            navigate("/choosePancho.html");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dog.imgUrl]);

    // Keep this page's numbers live even if the passive hunger/health
    // tick (running on raisePancho.html in another tab) writes to
    // localStorage while this page is open (ported from panchoStats.js).
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

    const completedSteps = currentAssignment.steps.filter((s) => s.completed).length;
    const stepsRemaining = TOTAL_ASSIGNMENT_STEPS - completedSteps;
    const barWidth = (completedSteps / TOTAL_ASSIGNMENT_STEPS) * 100 + "%";

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#c9a187]">
            <div className="absolute inset-0 bg-[url('/images/fondoS.jpeg')] bg-cover bg-center bg-no-repeat"></div>

            <main className="relative z-10 min-h-screen p-8">

                <h1 className="text-4xl font-bold uppercase text-black">
                    Pancho Stats
                </h1>

                <div className="mt-10 w-[300px]">

                    <section className="mb-6">
                        <h2 className="mb-2 text-xl font-bold">
                            Tasks remaining: <span id="tasksRemainingLabel">{stepsRemaining}</span>
                        </h2>

                        <div className="h-5 overflow-hidden rounded-full border border-black bg-[#b9d9f0]">
                            <div id="tasksRemainingBar" className="h-full rounded-full bg-[#5654e8] transition-all duration-300" style={{ width: barWidth }}></div>
                        </div>
                    </section>

                    <section className="mb-6">
                        <h2 className="mb-2 text-xl font-bold">
                            Hunger
                        </h2>

                        <div className="flex h-7 items-center justify-center rounded-full border border-black bg-[#b9d9f0] text-xs font-bold">
                            <span id="hungerStat">{dog.hunger}</span>&nbsp;/&nbsp;100
                        </div>
                    </section>

                    <section className="mb-6">
                        <h2 className="mb-2 text-xl font-bold">
                            Health
                        </h2>

                        <div className="flex h-7 items-center justify-center rounded-full border border-black bg-[#b9d9f0] text-xs font-bold">
                            <span id="healthStat">{dog.health}</span>&nbsp;/&nbsp;100
                        </div>
                    </section>

                    <section className="mb-6">
                        <h2 className="mb-2 text-xl font-bold">
                            Tasks completed
                        </h2>

                        <div className="flex h-7 items-center justify-center rounded-full border border-black bg-[#b9d9f0] text-xs font-bold">
                            <span id="tasksCompletedStat">{student.assignmentsCompleted || 0}</span>
                        </div>
                    </section>

                    <section>
                        <h2 className="mb-2 text-xl font-bold">
                            Current coins
                        </h2>

                        <div className="flex h-7 items-center justify-center rounded-full border border-black bg-[#b9d9f0] text-xs font-bold">
                            <span id="coinsStat">{formatCoins(student.coins)}</span>
                        </div>
                    </section>

                    <p id="deadNotice" className={"mt-6 rounded-xl bg-red-100 border border-red-400 text-red-800 text-sm font-bold text-center px-4 py-3" + (dog.status !== "DEAD" ? " hidden" : "")}>
                        {DEAD_STATUS_MESSAGE}
                    </p>

                </div>

                <a href="/raisePancho.html"
                   className="absolute bottom-8 left-8 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#b9d9f0] text-2xl transition hover:scale-110">
                    ➜
                </a>

            </main>
        </div>
    );
}
