import { formatCoins } from "../../lib/formatCoins.js";
import DeadNotice from "../raise/DeadNotice.jsx";
import StatPill from "./StatPill.jsx";

export default function StatsPanel({ dog, student }) {
    return (
        <div className="mt-10 w-[300px]">
            <StatPill title="Hunger">
                <span id="hungerStat">{dog?.hunger ?? 0}</span>&nbsp;/&nbsp;100
            </StatPill>

            <StatPill title="Health">
                <span id="healthStat">{dog?.health ?? 0}</span>&nbsp;/&nbsp;100
            </StatPill>

            <StatPill title="Tasks completed">
                <span id="tasksCompletedStat">{student?.assignmentsCompleted || 0}</span>
            </StatPill>

            <StatPill title="Current coins">
                <span id="coinsStat">{formatCoins(student?.coins ?? 0)}</span>
            </StatPill>

            <DeadNotice dog={dog} className="mt-6 rounded-xl bg-red-100 border border-red-400 text-red-800 text-sm font-bold text-center px-4 py-3" />
        </div>
    );
}