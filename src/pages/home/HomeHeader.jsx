import { Link, useNavigate } from "react-router-dom";
import { useDarkMode } from "../../lib/useDarkMode.js";
import { useAccess } from "../../lib/useAccess.js";
import { revokeAccess } from "../../lib/auth.js";

const NAV_LINK_CLASS = "font-display font-semibold text-sm sm:text-xl no-underline text-black dark:text-white mx-2 sm:mx-5 font-bold capitalize";

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

// Login/Logout toggle. Logged in -> "Log out" clears the access flag
// (lib/auth.js) and sends the user Home; logged out -> plain link to
// the /login screen (ProtectedRoute already covers the reverse case).
function AuthAction() {
    const isLoggedIn = useAccess();
    const navigate = useNavigate();

    if (!isLoggedIn) {
        return <Link to="/login" className={NAV_LINK_CLASS}>Log in</Link>;
    }

    function handleLogout() {
        revokeAccess();
        navigate("/", { replace: true });
    }

    return (
        <button type="button" onClick={handleLogout} className={`${NAV_LINK_CLASS} bg-transparent border-0 cursor-pointer`}>
            Log out
        </button>
    );
}

export default function HomeHeader() {
    const { isDark, toggleDarkMode } = useDarkMode();

    return (
        <header className="sticky top-0 z-50 w-full box-border flex flex-wrap justify-between items-center gap-2 px-4 sm:px-[50px] py-2 sm:py-[2px] font-bold bg-[#8ff08c] dark:bg-[#214d2a]">
            <h1 className="font-display text-xl sm:text-[2rem] text-left text-black dark:text-white m-0">Raise a Pancho</h1>

            <nav className="flex justify-end items-center">
                <Link to="/" className={NAV_LINK_CLASS}>Home</Link>
                <Link to="/aboutus.html" className={NAV_LINK_CLASS}>About Us</Link>
                <AuthAction />
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
            </nav>
        </header>
    );
}
