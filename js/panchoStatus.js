// Self-contained module: creates and controls a floating status banner
// (loading / success / error) for the Pancho selection flow.
//
// It builds its own DOM node with inline styles instead of relying on a
// specific element already existing in the page's HTML, and instead of
// relying on Tailwind utility classes (which the Play CDN generates
// asynchronously via a MutationObserver — fine for most things, but not
// worth the risk for a message that might only be visible for a second).

const BANNER_ID = "panchoStatusBanner";
const STYLE_ID = "panchoStatusStyles";

const MESSAGES = {
    loading: "Loading Pancho...",
    success: "Pancho ready to be raised!",
    error: "Something got wrong with Pancho",
    offline: "You're offline - showing saved data"
};

const COLORS = {
    loading: { bg: "#374151", text: "#ffffff" }, // slate
    success: { bg: "#16a34a", text: "#ffffff" }, // green
    error: { bg: "#dc2626", text: "#ffffff" },   // red
    offline: { bg: "#b45309", text: "#ffffff"}   // ambar
};

function injectStyles() {

    if (document.getElementById(STYLE_ID)) {
        return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
        @keyframes panchoStatusSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes panchoStatusFadeIn {
            from { opacity: 0; transform: translate(-50%, -12px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
    `;

    document.head.appendChild(style);
}

function getOrCreateBanner() {

    injectStyles();

    let banner = document.getElementById(BANNER_ID);

    if (banner) {
        return banner;
    }

    banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");

    Object.assign(banner.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translate(-50%, 0)",
        zIndex: "9999",
        display: "none",
        alignItems: "center",
        gap: "10px",
        padding: "14px 26px",
        borderRadius: "999px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "16px",
        fontWeight: "600",
        letterSpacing: "0.01em",
        animation: "panchoStatusFadeIn 0.25s ease-out",
        maxWidth: "90vw",
        textAlign: "center",
        pointerEvents: "none"
    });

    const spinner = document.createElement("span");
    spinner.id = BANNER_ID + "-spinner";

    Object.assign(spinner.style, {
        display: "none",
        width: "16px",
        height: "16px",
        border: "3px solid rgba(255, 255, 255, 0.4)",
        borderTopColor: "#ffffff",
        borderRadius: "50%",
        animation: "panchoStatusSpin 0.7s linear infinite",
        flexShrink: "0"
    });

    const text = document.createElement("span");
    text.id = BANNER_ID + "-text";

    banner.appendChild(spinner);
    banner.appendChild(text);

    document.body.appendChild(banner);

    return banner;
}

function setStatus(state, customMessage) {

    const banner = getOrCreateBanner();
    const spinner = document.getElementById(BANNER_ID + "-spinner");
    const text = document.getElementById(BANNER_ID + "-text");

    const message = customMessage || MESSAGES[state] || "";

    if (message === "") {
        banner.style.display = "none";
        return;
    }

    const colors = COLORS[state] || COLORS.loading;

    banner.style.backgroundColor = colors.bg;
    banner.style.color = colors.text;
    banner.style.display = "flex";

    if (text) {
        text.textContent = message;
    }

    if (spinner) {
        spinner.style.display = state === "loading" ? "inline-block" : "none";
    }
}

export function showLoading() {
    setStatus("loading");
}

export function showSuccess(customMessage) {
    setStatus("success", customMessage);
}

export function showError(customMessage) {
    setStatus("error", customMessage);
}

export function clearStatus() {

    const banner = document.getElementById(BANNER_ID);

    if (banner) {
        banner.style.display = "none";
    }
}

export function showOffline(customMessage) {
    setStatus("offline", customMessage);
}