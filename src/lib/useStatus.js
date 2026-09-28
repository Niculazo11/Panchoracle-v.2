import { useCallback, useState } from "react";

// React port of js/panchoStatus.js. The original module built its own
// DOM node imperatively; here the same 4 states (loading/success/error/
// offline) and default copy live in component state instead, and
// <PanchoStatusBanner /> renders them declaratively.
export const STATUS_MESSAGES = {
    loading: "Loading Pancho...",
    success: "Pancho ready to be raised!",
    error: "Something got wrong with Pancho",
    offline: "You're offline - showing saved data"
};

export function useStatus() {
    const [status, setStatus] = useState(null); // { state, message } | null

    const showLoading = useCallback(() => {
        setStatus({ state: "loading", message: STATUS_MESSAGES.loading });
    }, []);

    const showSuccess = useCallback((customMessage) => {
        setStatus({ state: "success", message: customMessage || STATUS_MESSAGES.success });
    }, []);

    const showError = useCallback((customMessage) => {
        setStatus({ state: "error", message: customMessage || STATUS_MESSAGES.error });
    }, []);

    const showOffline = useCallback((customMessage) => {
        setStatus({ state: "offline", message: customMessage || STATUS_MESSAGES.offline });
    }, []);

    const clearStatus = useCallback(() => {
        setStatus(null);
    }, []);

    return { status, showLoading, showSuccess, showError, showOffline, clearStatus };
}
