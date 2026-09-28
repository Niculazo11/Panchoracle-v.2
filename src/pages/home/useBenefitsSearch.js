import { useEffect, useMemo, useRef, useState } from "react";
import { BENEFITS } from "./benefits.js";

// Search + the original Ctrl+K shortcut (focus the input when empty,
// otherwise open the first match translated on Google Translate).
export function useBenefitsSearch() {
    const [searchText, setSearchText] = useState("");
    const searchInputRef = useRef(null);

    const normalizedSearch = searchText.toLowerCase().trim();

    const visibleBenefits = useMemo(() => {
        if (normalizedSearch === "") {
            return [];
        }
        return BENEFITS.filter((b) => b.toLowerCase().includes(normalizedSearch));
    }, [normalizedSearch]);

    const showNoResults = normalizedSearch !== "" && visibleBenefits.length === 0;

    useEffect(() => {
        function handleKeydown(event) {
            if (event.ctrlKey && event.key.toLowerCase() === "k") {
                event.preventDefault();

                if (normalizedSearch === "") {
                    searchInputRef.current && searchInputRef.current.focus();
                    return;
                }

                const foundBenefit = BENEFITS.find((b) => b.toLowerCase().includes(normalizedSearch));

                if (foundBenefit) {
                    const translationURL =
                        "https://translate.google.com/?sl=en&tl=es&text=" +
                        encodeURIComponent(foundBenefit) +
                        "&op=translate";

                    window.open(translationURL, "_blank");
                }
            }
        }

        document.addEventListener("keydown", handleKeydown);
        return () => document.removeEventListener("keydown", handleKeydown);
    }, [normalizedSearch]);

    return { searchText, setSearchText, searchInputRef, visibleBenefits, showNoResults };
}
