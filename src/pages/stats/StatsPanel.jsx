import { formatCoins } from "../../lib/formatCoins.js";
import DeadNotice from "../raise/DeadNotice.jsx";
import StatPill from "./StatPill.jsx";

const TOTAL_ASSIGNMENT_STEPS = 4;

export default function StatsPanel({ dog, student, currentAssignment }) {
    const completedSteps = currentAssignment.steps.filter((s) => s.completed).length;
    const stepsRemaining = TOTAL_ASSIGNMENT_STEPS - completedSteps;
    const barWidth = (completedSteps / TOTAL_ASSIGNMENT_STEPS) * 100 + "%";

    return (
        <div className="mt-10 w-[300px]">

            <section className="mb-6">
                <h2 className="mb-2 text-xl font-bold">
                    Tasks remaining: <span id="tasksRemainingLabel">{stepsRemaining}</span>
                </h2>

                <div className="h-5 overflow-hidden rounded-full border border-black bg-[#b9d9f0]">
                    <div id="tasksRemainingBar" className="h-full rounded-full bg-[#5654e8] transition-all duration-300" style={{ width: barWidth }}></div>
                </div>
            </section>

            <StatPill title="Hunger">
                <span id="hungerStat">{dog.hunger}</span>&nbsp;/&nbsp;100
            </StatPill>

            <StatPill title="Health">
                <span id="healthStat">{dog.health}</span>&nbsp;/&nbsp;100
            </StatPill>

            <StatPill title="Tasks completed">
                <span id="tasksCompletedStat">{student.assignmentsCompleted || 0}</span>
            </StatPill>

            <StatPill title="Current coins">
                <span id="coinsStat">{formatCoins(student.coins)}</span>
            </StatPill>

            <DeadNotice dog={dog} className="mt-6 rounded-xl bg-red-100 border border-red-400 text-red-800 text-sm font-bold text-center px-4 py-3" />

        </div>
    );
}
