const COLORS = {
    loading: { bg: "#374151", text: "#ffffff" }, // slate
    success: { bg: "#16a34a", text: "#ffffff" }, // green
    error: { bg: "#dc2626", text: "#ffffff" },   // red
    offline: { bg: "#b45309", text: "#ffffff" }  // ambar
};

// React port of the floating banner js/panchoStatus.js used to build by
// hand with document.createElement. Same fixed position, colors,
// spinner and fade-in animation (see the keyframes ported into
// src/index.css), driven by the { status, message } produced by the
// useStatus() hook instead of imperative DOM calls.
export default function PanchoStatusBanner({ status }) {

    if (!status || !status.message) {
        return null;
    }

    const colors = COLORS[status.state] || COLORS.loading;

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: "fixed",
                top: "20px",
                left: "50%",
                transform: "translate(-50%, 0)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 26px",
                borderRadius: "999px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "0.01em",
                animation: "panchoStatusFadeIn 0.25s ease-out",
                maxWidth: "90vw",
                textAlign: "center",
                pointerEvents: "none",
                backgroundColor: colors.bg,
                color: colors.text
            }}
        >
            {status.state === "loading" && (
                <span
                    style={{
                        display: "inline-block",
                        width: "16px",
                        height: "16px",
                        border: "3px solid rgba(255, 255, 255, 0.4)",
                        borderTopColor: "#ffffff",
                        borderRadius: "50%",
                        animation: "panchoStatusSpin 0.7s linear infinite",
                        flexShrink: 0
                    }}
                />
            )}
            <span>{status.message}</span>
        </div>
    );
}
