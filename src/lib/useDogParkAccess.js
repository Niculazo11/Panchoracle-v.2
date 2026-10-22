import { useSyncExternalStore } from "react";
import { hasDogParkAccess, subscribeDogParkAccess } from "./dogParkAuth.js";

function subscribe(callback) {
    const unsubscribe = subscribeDogParkAccess(callback);

    // Another tab logging in/out should unlock/lock this one too.
    window.addEventListener("storage", callback);

    return () => {
        unsubscribe();
        window.removeEventListener("storage", callback);
    };
}

// Boolean snapshot, so useSyncExternalStore never loops.
export function useDogParkAccess() {
    return useSyncExternalStore(subscribe, hasDogParkAccess, () => false);
}