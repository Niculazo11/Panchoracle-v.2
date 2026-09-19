import { useSyncExternalStore } from "react";
import { hasAccess, subscribeAccess } from "./auth.js";

function subscribe(callback) {
    const unsubscribe = subscribeAccess(callback);

    // Another tab logging in/out should unlock this one too.
    window.addEventListener("storage", callback);

    return () => {
        unsubscribe();
        window.removeEventListener("storage", callback);
    };
}

// Boolean snapshot, so useSyncExternalStore never loops.
export function useAccess() {
    return useSyncExternalStore(subscribe, hasAccess, () => false);
}
