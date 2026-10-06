// bg/text pairs matching Tailwind's default palette exactly (gray-700,
// green-600, red-600, amber-700), so the state -> color mapping lives
// in Tailwind classes instead of hard-coded hex in a style attribute.
const COLOR_CLASSES = {
    loading: "bg-gray-700 text-white",
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    offline: "bg-amber-700 text-white"
};

// React port of the floating banner js/panchoStatus.js used to build by
// hand with document.createElement. Same fixed position, colors,
// spinner and fade-in animation (now Tailwind utilities + the
// status-fade-in / status-spin animations in tailwind.config.js),
// driven by the { status, message } produced by the useStatus() hook
// instead of imperative DOM calls.
export default function PanchoStatusBanner({ status }) {

    if (!status || !status.message) {
        return null;
    }

    const colorClasses = COLOR_CLASSES[status.state] || COLOR_CLASSES.loading;

    return (
        <div
            role="status"
            aria-live="polite"
            className={
                "fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 " +
                "px-[26px] py-3.5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] " +
                "font-sans text-base font-semibold tracking-wide animate-status-fade-in " +
                "max-w-[90vw] text-center pointer-events-none " + colorClasses
            }
        >
            {status.state === "loading" && (
                <span className="inline-block w-4 h-4 rounded-full border-[3px] border-white/40 border-t-white animate-status-spin shrink-0" />
            )}
            <span>{status.message}</span>
        </div>
    );
}
