import { useState, useEffect } from "react";
import { asset } from "../lib/asset.js";
import { useFeedback } from "../lib/useFeedback.js";
import { fetchAssignedMinigames } from "../lib/gameApi.js";
import Quiz from "./minigames/Quiz.jsx";

const FEEDBACK_TIMEOUT_MS = 3000;

// Minigame components registry - maps minigameId to component
const MINIGAME_COMPONENTS = {
  quiz: Quiz,
  // Future: memory: MemoryGame,
};

export default function MiniGames() {
  const { feedback, showFeedback } = useFeedback(FEEDBACK_TIMEOUT_MS);
  const [assignedMinigames, setAssignedMinigames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMinigame, setActiveMinigame] = useState(null);

  // Load assigned minigames on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchAssignedMinigames()
      .then((list) => {
        if (!cancelled) setAssignedMinigames(list);
      })
      .catch((error) => {
        console.error("Failed to fetch assigned minigames:", error);
        if (!cancelled) setAssignedMinigames([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Server already awards coins via POST /minigames/quiz/submit (UN-501).
  // Just show feedback with the score.
  function handleQuizComplete(correctCount) {
    if (correctCount > 0) {
      showFeedback(`Quiz complete! You earned ${correctCount} coin${correctCount > 1 ? 's' : ''}.`);
    } else {
      showFeedback("Quiz complete! Better luck next time.");
    }
    setActiveMinigame(null);
  }

  function handleMinigameComplete(minigameId, result) {
    // Generic handler for future minigames
    // For quiz, result is just correctCount (number). For future games, could be an object with reward.
    const reward = typeof result === 'number' ? result : (result?.reward ?? 0);
    if (reward > 0) {
      showFeedback(`Minigame complete! You earned ${reward} coin${reward > 1 ? 's' : ''}.`);
    } else {
      showFeedback("Minigame complete!");
    }
    setActiveMinigame(null);
  }

  function startMinigame(minigameId) {
    setActiveMinigame(minigameId);
  }

  // Always include Quiz as an always-available minigame
  const allMinigames = [
    { id: "quiz", name: "Quick Quiz", description: "5 quick trivia questions to earn coins", alwaysAvailable: true },
    ...assignedMinigames.map((mg) => ({ ...mg, alwaysAvailable: false })),
  ];

  // Deduplicate by minigameId (in case quiz is also assigned)
  const uniqueMinigames = Object.values(
    allMinigames.reduce((acc, mg) => {
      if (!acc[mg.id] || mg.alwaysAvailable) {
        acc[mg.id] = mg;
      }
      return acc;
    }, {})
  );

  if (loading) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden bg-[#a3a960]">
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
          <p className="text-2xl font-bold text-[#1a1a1a]">Loading minigames...</p>
        </div>
      </main>
    );
  }

  // Render the active minigame or the list
  if (activeMinigame) {
    const Component = MINIGAME_COMPONENTS[activeMinigame];
    if (Component) {
      return (
        <main className="relative min-h-screen w-full overflow-hidden bg-[#a3a960]">
          <img
            src={asset("images/fondo-minigame.jpeg")}
            alt="Minigames background"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-bottom"
          />
          <div className="relative z-10 flex min-h-screen flex-col justify-start gap-8 px-6 py-12 sm:px-12 sm:py-16">
            <Component onComplete={(result) => handleMinigameComplete(activeMinigame, result)} />
          </div>
        </main>
      );
    }
    // Fallback if component not found
    setActiveMinigame(null);
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#a3a960]">
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

        <div className="flex flex-col gap-4 w-full max-w-xl">
          {uniqueMinigames.map((mg) => (
            <button
              key={mg.id}
              type="button"
              onClick={() => startMinigame(mg.id)}
              className="w-full rounded-lg bg-white/90 p-6 text-left shadow-md transition hover:bg-white hover:shadow-lg border border-gray-200 dark:bg-[#14200f]/95 dark:border-gray-700 dark:hover:bg-[#1a3d1a]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="m-0 text-xl font-bold text-[#1a1a1a] dark:text-white">{mg.name}</h2>
                  <p className="m-0 mt-1 text-sm text-[#1a1a1a]/70 dark:text-gray-300">{mg.description}</p>
                  {!mg.alwaysAvailable && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-[#5a57d9]/20 text-[#5a57d9] rounded">
                      Assigned by teacher
                    </span>
                  )}
                  {mg.alwaysAvailable && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                      Always available
                    </span>
                  )}
                </div>
                <span className="flex-shrink-0 text-3xl" aria-hidden="true">
                  {mg.id === "quiz" ? "📝" : "🎮"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {feedback && (
          <p className="max-w-md rounded-lg bg-white/90 px-4 py-3 font-semibold text-black shadow">
            {feedback}
          </p>
        )}
      </div>
    </main>
  );
}