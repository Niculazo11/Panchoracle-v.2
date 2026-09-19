import { useEffect } from "react";

// The original aboutus.html used a plain <style> block (not Tailwind)
// with page-wide selectors. Since this is now one page among several in
// a single-page app sharing one <head>, the stylesheet is injected on
// mount and removed on unmount so it never leaks onto other routes.
export function usePageStyles(id, css) {
    useEffect(() => {
        const style = document.createElement("style");
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, [id, css]);
}
