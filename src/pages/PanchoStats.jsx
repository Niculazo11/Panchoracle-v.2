import { useEffect, useState } from "react";
import { getMySubmissions } from "../lib/submissionApi.js";
import { getAssignments } from "../lib/assignmentApi.js";
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
    const [history, setHistory] = useState({ loading: true, error: "", submissions: [], titles: {} });

    useEffect(() => {
        if (!student?.userId) return;
        const controller = new AbortController();
        setHistory({ loading: true, error: "", submissions: [], titles: {} });
        // Assignment listing covers the current period; older submissions remain visible
        // by their ID even if the assignment is no longer in that list.
        Promise.all([getMySubmissions(controller.signal), getAssignments(controller.signal).catch(() => [])])
            .then(([submissions, assignments]) => {
                if (controller.signal.aborted) return;
                setHistory({
                    loading: false,
                    error: "",
                    submissions: [...submissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
                    titles: Object.fromEntries(assignments.map((item) => [item.id, item.title])),
                });
            })
            .catch((error) => {
                if (controller.signal.aborted) return;
                setHistory((current) => ({ ...current, loading: false, error: error.message || "Could not load homework history." }));
            });
        return () => controller.abort();
    }, [student?.userId]);

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

                <section className="mb-24 max-w-2xl rounded-2xl bg-white/90 p-5 text-black shadow-lg" aria-labelledby="completed-homework-title">
                    <h2 id="completed-homework-title" className="mb-4 text-2xl font-bold">Completed Homework</h2>
                    {history.loading ? <p role="status">Loading submitted homework...</p> : null}
                    {history.error ? <p role="alert">{history.error}</p> : null}
                    {!history.loading && !history.error && history.submissions.length === 0 ? (
                        <p>No homework submitted yet.</p>
                    ) : null}
                    {!history.loading && !history.error && history.submissions.length > 0 ? (
                        <ul className="space-y-3">
                            {history.submissions.map((submission) => (
                                <li key={submission.id} className="rounded-xl border border-black/20 bg-white p-4">
                                    <h3 className="font-bold">{history.titles[submission.assignmentId] || `Assignment ${submission.assignmentId}`}</h3>
                                    <p className="text-sm">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                                    {submission.fileUrl ? (
                                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                                            {submission.kind === "link" ? "Open submitted link" : `View ${submission.fileName || "submitted file"}`}
                                        </a>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </section>

                <Link to="/raisePancho.html"
                   className="fixed bottom-8 left-8 z-20 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#b9d9f0] text-2xl transition hover:scale-110">
                    ➜
                </Link>

            </main>
        </div>
    );
}