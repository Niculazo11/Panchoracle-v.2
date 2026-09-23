import { useCallback, useEffect, useState } from "react";

// Toggles the "dark-mode" class on <body> (tailwind.config: darkMode:
// ['selector', '.dark-mode']) and remembers the choice in localStorage.
const STORAGE_KEY = "theme";
const DARK_CLASS = "dark-mode";

function readStoredTheme() {
    try {
        return localStorage.getItem(STORAGE_KEY) === "dark";
    } catch {
        return false;
    }
}

export function useDarkMode() {
    const [isDark, setIsDark] = useState(readStoredTheme);

    useEffect(() => {
        document.body.classList.toggle(DARK_CLASS, isDark);
    }, [isDark]);

    const toggleDarkMode = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
            } catch {
                /* storage unavailable: the toggle still works for this session */
            }
            return next;
        });
    }, []);

    return { isDark, toggleDarkMode };
}
