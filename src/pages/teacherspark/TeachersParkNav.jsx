import { useNavigate } from "react-router-dom";
import { useAccess } from "../../lib/useAccess.js";
import { useDarkMode } from "../../lib/useDarkMode.js";
import { asset } from "../../lib/asset.js";
import { NAV_ITEMS } from "./navItems.js";
import TeachersParkNavItem from "./TeachersParkNavItem.jsx";

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export default function TeachersParkNav() {
    const navigate = useNavigate();
    const { logout } = useAccess();
    const { isDark, toggleDarkMode } = useDarkMode();

    function handleLogout() {
        logout();
        navigate("/", { replace: true });
    }

    return (
        <nav className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-3 bg-[#d3b48c] dark:bg-[#3d2f1a] border-b-4 border-[#7c3aed] dark:border-[#a855f7]">
            <div className="flex items-center gap-3">
                <h1 className="m-0 text-3xl sm:text-5xl font-bold tracking-wide text-black dark:text-white">
                    Raise a Pancho
                </h1>
                <img src={asset("images/paw.png")} alt="" className="w-10 h-10 sm:w-14 sm:h-14 brightness-0 dark:brightness-100" />
            </div>

            <ul className="flex items-start gap-4 sm:gap-8 m-0 p-0 list-none">
                {NAV_ITEMS.map((item) => (
                    <li key={item.id}>
                        <TeachersParkNavItem item={item} />
                    </li>
                ))}
                <li>
                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        aria-pressed={isDark}
                        title={isDark ? "Light mode" : "Dark mode"}
                        className="flex items-center gap-1 mx-2 sm:mx-5 p-1 bg-transparent border-0 cursor-pointer text-black dark:text-white"
                    >
                        <span className={isDark ? "opacity-40" : "opacity-100"}><SunIcon /></span>
                        <span className={isDark ? "opacity-100" : "opacity-40"}><MoonIcon /></span>
                    </button>
                </li>
                <li>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="bg-transparent border-0 cursor-pointer text-black dark:text-white font-serif text-sm sm:text-base underline"
                    >
                        Log out
                    </button>
                </li>
            </ul>
        </nav>
    );
}