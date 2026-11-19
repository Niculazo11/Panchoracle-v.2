import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import ParkBackground from "./ParkBackground.jsx";
import { getAssignedMinigames, assignMinigame, removeMinigameAssignment, getClassroomMinigamePlays } from "../../lib/classroomApi.js";
import { useFeedback } from "../../lib/useFeedback.js";

const FEEDBACK_TIMEOUT_MS = 3000;

// Available minigames catalog (matches server's AVAILABLE_MINIGAMES)
const AVAILABLE_MINIGAMES = [
  { id: "quiz", name: "Quick Quiz", description: "5 quick general knowledge questions" },
  // Future: { id: "memory", name: "Memory Match", description: "Find the pairs" },
];

/**
 * Placeholder component for minigame photos.
 * TODO(COMPAÑERO): Reemplazar este componente con la imagen real del minijuego.
 * Las fotos deben colocarse en public/images/minigames/ con el nombre del minigameId (ej: quiz.png, memory.png).
 * Luego actualizar este componente para usar <img src={asset(`images/minigames/${minigameId}.png`)} />.
 */
function MinigamePhotoPlaceholder({ minigameId, className = "" }) {
  // TODO: Cuando se agreguen las fotos, cambiar esto por:
  // import { asset } from "../../lib/asset.js";
  // return <img src={asset(`images/minigames/${minigameId}.png`)} alt={minigameId} className={className} />;
  return (
    <div className={`w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`} aria-label={`Foto de ${minigameId}`}>
      <span className="text-2xl" aria-hidden="true">🎮</span>
    </div>
  );
}

export default function ManageMinigames() {
  const navigate = useNavigate();
  const { classroom, showError } = useOutletContext();
  const { feedback, showFeedback } = useFeedback(FEEDBACK_TIMEOUT_MS);
  const [assignedMinigames, setAssignedMinigames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [plays, setPlays] = useState([]);
  const [loadingPlays, setLoadingPlays] = useState(true);

  const classroomId = classroom?.id;

  // Load assigned minigames on mount and when classroom changes
  useEffect(() => {
    if (!classroomId) {
      setAssignedMinigames([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getAssignedMinigames(classroomId)
      .then((list) => {
        if (!cancelled) setAssignedMinigames(list);
      })
      .catch((error) => {
        if (!cancelled) showError(error.name === "ApiError" ? error.message : "Could not load minigames.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [classroomId, showError]);

  // Load student minigame completions (plays)
  useEffect(() => {
    if (!classroomId) {
      setPlays([]);
      setLoadingPlays(false);
      return;
    }

    let cancelled = false;
    setLoadingPlays(true);

    getClassroomMinigamePlays(classroomId)
      .then((list) => {
        if (!cancelled) setPlays(list);
      })
      .catch((error) => {
        console.error("Failed to load minigame plays:", error);
        if (!cancelled) setPlays([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPlays(false);
      });

    return () => { cancelled = true; };
  }, [classroomId]);

  // Get minigames that are not yet assigned
  const availableToAssign = AVAILABLE_MINIGAMES.filter(
    (mg) => !assignedMinigames.some((a) => a.minigameId === mg.id)
  );

  async function handleAssign(minigameId) {
    if (!classroomId) return;
    setAssigning(true);
    try {
      await assignMinigame(classroomId, minigameId);
      showFeedback("Minigame assigned successfully!");
      // Reload the list
      const list = await getAssignedMinigames(classroomId);
      setAssignedMinigames(list);
    } catch (error) {
      showError(error.name === "ApiError" ? error.message : "Failed to assign minigame.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemove(assignmentId) {
    if (!classroomId) return;
    if (!window.confirm("Are you sure you want to remove this minigame assignment?")) return;

    try {
      await removeMinigameAssignment(classroomId, assignmentId);
      showFeedback("Minigame assignment removed.");
      const list = await getAssignedMinigames(classroomId);
      setAssignedMinigames(list);
    } catch (error) {
      showError(error.name === "ApiError" ? error.message : "Failed to remove assignment.");
    }
  }

  return (
    <ParkBackground>
      <div className="relative z-10 max-w-4xl mx-auto mt-12 p-6 sm:p-8 rounded-lg bg-white/95 text-black dark:bg-[#14200f]/95 dark:text-white shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#5a57d9] rounded hover:bg-[#4a47c9] transition-colors"
          >
            Back
          </button>
          <h2 className="m-0 mb-6 text-3xl font-bold text-center">Manage Minigames</h2>
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
        ) : (
          <>
            {/* Assigned Minigames */}
            <section className="mb-8">
              <h3 className="m-0 mb-4 text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">
                Assigned Minigames ({assignedMinigames.length})
              </h3>
              {assignedMinigames.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                  No minigames assigned yet. Choose from available minigames below.
                </p>
              ) : (
                <ul className="m-0 p-0 list-none space-y-3">
                  {assignedMinigames.map((mg) => (
                    <li
                      key={mg._id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-4">
                        <MinigamePhotoPlaceholder minigameId={mg.minigameId} />
                        <div>
                          <p className="m-0 font-medium">{mg.name}</p>
                          <p className="m-0 text-sm text-gray-600 dark:text-gray-400">{mg.description}</p>
                          <p className="m-0 mt-1 text-xs text-gray-500 dark:text-gray-500">
                            Assigned: {new Date(mg.assignedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(mg._id)}
                        disabled={assigning}
                        className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Available Minigames to Assign */}
            <section className="mb-8">
              <h3 className="m-0 mb-4 text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">
                Available Minigames ({availableToAssign.length})
              </h3>
              {availableToAssign.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                  All available minigames are already assigned.
                </p>
              ) : (
                <ul className="m-0 p-0 list-none space-y-3">
                  {availableToAssign.map((mg) => (
                    <li
                      key={mg.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-4">
                        <MinigamePhotoPlaceholder minigameId={mg.id} />
                        <div>
                          <p className="m-0 font-medium">{mg.name}</p>
                          <p className="m-0 text-sm text-gray-600 dark:text-gray-400">{mg.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAssign(mg.id)}
                        disabled={assigning}
                        className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-[#5a57d9] rounded hover:bg-[#4a47c9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {assigning ? "Assigning..." : "Assign"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Student Minigame Completions */}
            <section>
              <h3 className="m-0 mb-4 text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">
                Student Minigame Completions ({plays.length})
              </h3>
              {loadingPlays ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-4">Loading completions...</p>
              ) : plays.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-4">
                  No minigame completions yet. Students will appear here when they complete assigned minigames.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Student</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Minigame</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Score / Reward</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Completed At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plays.map((play) => (
                        <tr key={play._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-medium">{play.studentName}</td>
                          <td className="px-4 py-3 flex items-center gap-3">
                            <MinigamePhotoPlaceholder minigameId={play.minigameId} className="w-8 h-8" />
                            <span>{play.minigameName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              {play.reward} coin{play.reward !== 1 ? 's' : ''} earned
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {new Date(play.playedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {feedback && (
          <p className="mt-4 max-w-md rounded-lg bg-white/90 px-4 py-3 font-semibold text-black shadow">
            {feedback}
          </p>
        )}
      </div>
    </ParkBackground>
  );
}