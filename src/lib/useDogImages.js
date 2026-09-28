import { useCallback, useEffect, useState } from "react";
import { getDachshunds, STATIC_DOG_IMAGE } from "./dogApi.js";
import { wait } from "./wait.js";

const MIN_LOADING_MS = 600;
const ERROR_MESSAGE = "Something got wrong with Pancho";

// Async consumption of the dog.ceo API with the three interface states
// (loading / success / error) plus the offline case, tied to an
// AbortController whose abort() runs in the effect cleanup.
//
// images[0] is always the fixed local drawing (STATIC_DOG_IMAGE) — it's
// never fetched and never in a loading/error state of its own.
// images[1] is the one live pick from the API.
export function useDogImages() {
    const [images, setImages] = useState([STATIC_DOG_IMAGE, null]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [offline, setOffline] = useState("");
    const [fromCache, setFromCache] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    const reload = useCallback(() => setReloadToken((token) => token + 1), []);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        async function loadPanchoDogs() {

            if (!navigator.onLine) {
                setLoading(false);
                setOffline("No internet connection");
                return;
            }
            setLoading(true);
            setError("");
            setOffline("");

            try {
                const [result] = await Promise.all([
                    getDachshunds(controller.signal),
                    wait(MIN_LOADING_MS)
                ]);

                if (!active) {
                    return;
                }
                if (result.images.length < 1) {
                    setImages([STATIC_DOG_IMAGE, null]);
                    setError(ERROR_MESSAGE);
                } else {
                    setImages([STATIC_DOG_IMAGE, result.images[0]]);
                    setFromCache(result.fromCache);
                }
            } catch (requestError) {
                if (active && requestError.name !== "AbortError") {
                    setError(ERROR_MESSAGE);
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadPanchoDogs();

        function handleOffline() {
            setOffline("Internet connection lost");
            setLoading(false);
        }
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", reload);

        return () => {
            active = false;
            controller.abort();
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", reload);
        };
    }, [reloadToken, reload]);

    return { images, loading, error, offline, fromCache, reload };
}
