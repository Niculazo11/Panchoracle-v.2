import { Link } from "react-router-dom";
import CopyCodeButton from "./CopyCodeButton.jsx";
import { CLASSROOM_PATH, SETTINGS_PATH } from "./teacherPaths.js";

// Period dates are UTC instants: format them in UTC so a day never shifts.
function formatDate(iso) {
    return new Date(iso).toLocaleDateString("es", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
}

const LINK_CLASS = "min-h-11 inline-flex items-center px-4 py-2 rounded border-2 border-[#5a57d9] text-[#5a57d9] dark:border-[#c4b5fd] dark:text-[#c4b5fd] font-bold no-underline";

// One classroom of the panel: name, period, join code and the two actions.
export default function ClassroomCard({ classroom, onCopyError }) {
    return (
        <article className="rounded-lg p-4 sm:p-6 bg-white/95 text-black dark:bg-[#14200f]/95 dark:text-white shadow-lg">
            <h3 className="m-0 mb-1 text-2xl font-bold break-words">{classroom.name}</h3>
            <p className="m-0 mb-4 text-sm opacity-80">
                {formatDate(classroom.period.startDate)} – {formatDate(classroom.period.endDate)}
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm">Código del salón</span>
                <code className="px-4 py-2 rounded bg-[#dddddd] text-black font-mono text-2xl tracking-widest select-all">
                    {classroom.joinCode}
                </code>
                <CopyCodeButton code={classroom.joinCode} onCopyError={onCopyError} />
            </div>

            <div className="flex flex-wrap gap-3">
                <Link to={CLASSROOM_PATH} className={LINK_CLASS}>Abrir salón</Link>
                <Link to={SETTINGS_PATH} className={LINK_CLASS}>Ajustes</Link>
            </div>
        </article>
    );
}
