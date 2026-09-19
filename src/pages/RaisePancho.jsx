import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { useFeedback } from "../lib/useFeedback.js";
import RaiseNav from "./raise/RaiseNav.jsx";
import PanchoSection from "./raise/PanchoSection.jsx";
import StatusBars from "./raise/StatusBars.jsx";
import AssignmentPanel from "./raise/AssignmentPanel.jsx";
import DeadNotice from "./raise/DeadNotice.jsx";

const TICK_INTERVAL_MS = 15000; // hunger drops a bit passively every 15s
const FEEDBACK_TIMEOUT_MS = 3000;

export default function RaisePancho() {
    const navigate = useNavigate();
    const { dog, student, currentAssignment, completeStep, submitAssignment, tick } = useGameState();
    const { feedback, showFeedback } = useFeedback(FEEDBACK_TIMEOUT_MS);

    // Redirect to ChoosePancho if the student hasn't picked a Pancho yet.
    useEffect(() => {
        if (!dog.imgUrl) {
            navigate("/choosePancho.html");
        }
    }, [dog.imgUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // Passive hunger decay while the tab stays open.
    useEffect(() => {
        const id = window.setInterval(() => tick(), TICK_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!dog.imgUrl) {
        return null;
    }

    function handleStepClick(stepId) {
        const result = completeStep(stepId);
        if (!result.success) showFeedback(result.message);
    }

    function handleSubmitAssignment() {
        const result = submitAssignment();
        showFeedback(result.success
            ? `Assignment submitted! +${result.rewards.hunger} Hunger`
            : result.message);
    }

    return (
        <div className="min-h-screen w-full bg-[url('/images/Background1.png')] bg-cover bg-center bg-no-repeat">

            <RaiseNav />

            <main className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 sm:gap-10 px-4 sm:px-6 py-8">
                <PanchoSection dog={dog} student={student} />

                <section className="w-full max-w-sm bg-white/85 rounded-2xl shadow-xl p-6 flex flex-col gap-6">

                    <DeadNotice dog={dog} className="rounded-xl bg-red-100 border border-red-400 text-red-800 text-sm font-bold text-center px-4 py-3" />

                    <StatusBars dog={dog} />

                    <AssignmentPanel
                        dog={dog}
                        assignment={currentAssignment}
                        feedback={feedback}
                        onStepClick={handleStepClick}
                        onSubmit={handleSubmitAssignment}
                    />
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
