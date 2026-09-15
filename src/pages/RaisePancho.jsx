import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { DEAD_STATUS_MESSAGE } from "../state/gameState.js";
import PanchoLayers from "../components/PanchoLayers.jsx";

const TICK_INTERVAL_MS = 15000; // hunger drops a bit passively every 15s (demo)
const FEEDBACK_TIMEOUT_MS = 3000;

function formatCoins(n) {
    return n.toLocaleString("en-US");
}

export default function RaisePancho() {
    const navigate = useNavigate();
    const { dog, student, currentAssignment, completeStep, submitAssignment, tick } = useGameState();

    const [feedback, setFeedback] = useState("");
    const feedbackTimeoutRef = useRef(null);

    function showFeedback(message) {
        if (!message) {
            return;
        }
        setFeedback(message);
        window.clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(""), FEEDBACK_TIMEOUT_MS);
    }

    // Redirect to ChoosePancho if the student hasn't picked a Pancho yet
    // (mirrors the guard at the top of dashboard.js).
    useEffect(() => {
        if (!dog.imgUrl) {
            navigate("/choosePancho.html");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dog.imgUrl]);

    // Passive hunger decay while the tab stays open.
    useEffect(() => {
        const id = window.setInterval(() => {
            tick();
        }, TICK_INTERVAL_MS);
        return () => window.clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!dog.imgUrl) {
        return null;
    }

    const prepSteps = currentAssignment.steps.filter((s) => s.id !== 4);
    const finalStep = currentAssignment.steps.find((s) => s.id === 4);
    const allPrepDone = prepSteps.every((s) => s.completed);
    const submitDisabled = !allPrepDone || dog.status === "DEAD";

    function handleStepClick(stepId) {
        const result = completeStep(stepId);
        if (!result.success) {
            showFeedback(result.message);
        }
    }

    function handleSubmitAssignment() {
        const result = submitAssignment();
        if (result.success) {
            showFeedback(`Assignment submitted! +${result.rewards.hunger} Hunger`);
        } else {
            showFeedback(result.message);
        }
    }

    return (
        <div className="min-h-screen w-full bg-[url('/images/Background1.png')] bg-cover bg-center bg-no-repeat">

            <nav className="relative flex items-center h-[110px] w-full bg-[oklch(90.1%_0.076_70.697)]">

                <h1 className="absolute left-2 bottom-4 text-4xl sm:text-6xl font-bold tracking-wide text-black">
                    Raise a pancho
                </h1>

                <Link to="/MiniGames.html" className="absolute right-3 top-1 flex flex-col items-center gap-1 text-black font-serif text-base">
                    <img src="/images/PlayingBall.png" alt="MiniGames" className="w-16 h-16 object-contain" />
                    <span>MiniGames</span>
                </Link>

                <Link to="/panchoStats.html" className="absolute right-28 top-1 flex flex-col items-center gap-1 text-black font-serif text-base">
                    <img src="/images/PlayingCards.png" alt="Stats" className="w-16 h-16 object-contain" />
                    <span>Stats</span>
                </Link>

            </nav>

            <main className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 px-5 py-8">

                {/* ====== Pancho + cosmetic layers ====== */}
                <section className="flex flex-col items-center gap-4">

                    <div className="flex items-center gap-3">
                        <span id="panchoStateBadge" className={"px-3 py-1 rounded-full text-xs font-bold text-white " + (dog.status === "ALIVE" ? "bg-emerald-600" : "bg-red-700")}>{dog.status}</span>
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/80 text-black">
                            <img src="/images/paw.png" alt="Coins" className="w-4 h-4" />
                            <span id="coinsLabel">{formatCoins(student.coins)}</span>
                        </span>
                    </div>

                    <div id="pancho-container" className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl bg-white/40 shadow-xl border-4 border-white/60 overflow-hidden">
                        <PanchoLayers dog={dog} />
                    </div>

                    <Link to="/Shop.html" className="mt-2 px-5 py-2 rounded-full bg-[#6B5A8E] text-white font-semibold shadow hover:opacity-90 transition">
                        Go to Shop
                    </Link>
                </section>

                {/* ====== Status bars + assignment checklist ====== */}
                <section className="w-full max-w-sm bg-white/85 rounded-2xl shadow-xl p-6 flex flex-col gap-6">

                    <p id="deadNotice" className={"rounded-xl bg-red-100 border border-red-400 text-red-800 text-sm font-bold text-center px-4 py-3" + (dog.status !== "DEAD" ? " hidden" : "")}>
                        {DEAD_STATUS_MESSAGE}
                    </p>

                    <div>
                        <div className="flex justify-between mb-1 text-sm font-bold">
                            <span>Hunger</span>
                            <span id="hungerLabel">{dog.hunger} / 100</span>
                        </div>
                        <div className="h-5 w-full rounded-full border border-black/20 bg-[#eee] overflow-hidden">
                            <div id="hungerBar" className="h-full bg-amber-500 transition-all duration-300" style={{ width: dog.hunger + "%" }}></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between mb-1 text-sm font-bold">
                            <span>Health</span>
                            <span id="healthLabel">{dog.health} / 100</span>
                        </div>
                        <div className="h-5 w-full rounded-full border border-black/20 bg-[#eee] overflow-hidden">
                            <div id="healthBar" className={"h-full transition-all duration-300 " + (dog.health <= 25 ? "bg-red-600" : "bg-emerald-500")} style={{ width: dog.health + "%" }}></div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold mb-1">Assignment Tasks</h2>
                        <p id="assignmentTitle" className="text-sm text-gray-600 mb-3">{currentAssignment.title}</p>

                        <ul id="stepsList" className="flex flex-col gap-2 mb-3">
                            {prepSteps.map((step) => (
                                <li key={step.id}>
                                    <button
                                        type="button"
                                        data-step-id={step.id}
                                        disabled={step.completed || dog.status === "DEAD"}
                                        onClick={() => handleStepClick(step.id)}
                                        className={
                                            "w-full flex items-center justify-between gap-3 rounded-xl border border-black/10 " +
                                            "px-4 py-3 text-left font-semibold shadow transition disabled:cursor-not-allowed " +
                                            (step.completed ? "bg-emerald-100 text-emerald-800" : "bg-white/80 hover:bg-white") +
                                            (dog.status === "DEAD" ? " opacity-50" : "")
                                        }
                                    >
                                        <span>Step {step.id}: {step.label}</span>
                                        <span className="text-lg">{step.completed ? "✅" : "◻️"}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {finalStep && (
                            <button
                                id="submitAssignmentBtn"
                                type="button"
                                disabled={submitDisabled}
                                onClick={handleSubmitAssignment}
                                className={
                                    "w-full rounded-xl bg-[#6B5A8E] text-white font-bold py-3 shadow transition hover:opacity-90 " +
                                    (submitDisabled ? "opacity-50 cursor-not-allowed" : "")
                                }
                            >
                                {allPrepDone ? `Step 4: ${finalStep.label}` : `Step 4: ${finalStep.label} (complete steps 1-3 first)`}
                            </button>
                        )}

                        <p id="dashboardFeedback" className="min-h-[1.25rem] mt-2 text-sm font-semibold text-center">{feedback}</p>
                    </div>

                </section>

            </main>

            {/* Shop cart image */}
            <Link to="/Shop.html" className="fixed bottom-0 left-3 flex flex-col items-center text-black font-serif text-base">
                SHOP
                <img src="/images/ShoppingCart.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
            </Link>
        </div>
    );
}
