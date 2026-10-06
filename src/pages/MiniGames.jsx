import { useState } from "react";
import { asset } from "../lib/asset.js";
import { useGameState } from "../state/GameStateContext.jsx";
import { useFeedback } from "../lib/useFeedback.js";
import Quiz from "./minigames/Quiz.jsx";

const FEEDBACK_TIMEOUT_MS = 3000;

// Ungraded, optional activities (separate from the teacher-assigned
// homework on RaisePancho) where coins are earned by playing instead of
// by academic progress. The quiz below is the first working example;
// more minigames can be added here later as sibling components under
// pages/minigames/, each reporting its score the same way.
export default function MiniGames() {
    const { awardMinigameCoins } = useGameState();
    const { feedback, showFeedback } = useFeedback(FEEDBACK_TIMEOUT_MS);
    const [isPlaying, setIsPlaying] = useState(false);

    function handleQuizComplete(correctCount) {
        const result = awardMinigameCoins(correctCount);
        showFeedback(result.message);
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#a3a960]">
            <img
                src={asset("images/fondo-minigame.jpeg")}
                alt="Minigames background"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-bottom"
            />

            <div className="relative z-10 flex min-h-screen flex-col justify-start gap-8 px-6 py-12 sm:px-12 sm:py-16">
                <div>
                    <h1 className="text-3xl font-extrabold uppercase text-[#1a1a1a] sm:text-4xl">Minigames</h1>
                    <p className="mt-2 max-w-md font-semibold text-[#1a1a1a]/80">
                        Quick, ungraded activities to earn coins for the shop. Your homework grade is never affected here.
                    </p>
                </div>

                {isPlaying ? (
                    <Quiz onComplete={handleQuizComplete} />
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        className="w-fit rounded-full bg-[#d9d9c8]/90 px-10 py-6 text-2xl font-extrabold uppercase tracking-wide text-[#1a1a1a] shadow-md transition hover:bg-[#e5e5d6] sm:text-3xl"
                    >
                        Start Quick Quiz
                    </button>
                )}

                {feedback && (
                    <p className="max-w-md rounded-lg bg-white/90 px-4 py-3 font-semibold text-black shadow">
                        {feedback}
                    </p>
                )}
            </div>
        </div>
    );
}
