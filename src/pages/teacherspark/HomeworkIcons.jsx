// Small inline icons of the Manage Homework page (decorative, so hidden from screen readers).
const BASE = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };

export function PenIcon() {
    return (
        <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" strokeWidth="1.5" {...BASE}>
            <path d="M3 21l3.5-1 12-12a2.1 2.1 0 0 0-3-3l-12 12L3 21z" />
            <path d="M14 7l3 3" />
        </svg>
    );
}

export function LongArrowIcon() {
    return (
        <svg viewBox="0 0 80 16" width="80" height="16" stroke="currentColor" strokeWidth="2.5" {...BASE}>
            <path d="M78 8H4M12 2L4 8l8 6" />
        </svg>
    );
}

export function BackIcon() {
    return (
        <svg viewBox="0 0 32 32" width="34" height="34" stroke="#d6e63a" strokeWidth="3.5" {...BASE}>
            <path d="M6 18h16a5 5 0 0 0 0-10H10M13 3l-5 5 5 5" />
        </svg>
    );
}
