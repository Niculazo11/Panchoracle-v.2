import { useCallback } from "react";

// React port of js/darkmode.js. The original script toggled a
// "dark-mode" class on <body> (tailwind.config: darkMode: ['selector',
// '.dark-mode']) whenever an element with id="dark-mode" was clicked —
// but no page in the original site actually renders that button, so
// the script was a no-op in practice. This hook preserves that exact
// behavior: it's available for any page to opt into, but isn't wired
// up anywhere by default, matching the original app 1:1.
const STORAGE_KEY = "theme";
const DARK_CLASS = "dark-mode";

export function useDarkMode() {
    const toggleDarkMode = useCallback(() => {
        const isDark = document.body.classList.toggle(DARK_CLASS);
        localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    }, []);

    return { toggleDarkMode };
}
