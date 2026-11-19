import { useCallback, useEffect, useState } from "react";
import { getDachshunds, STATIC_DOG_IMAGE } from "./dogApi.js";
import { wait } from "./wait.js";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { asset } from "./asset.js";

const MIN_LOADING_MS = 600;
const ERROR_MESSAGE = "Something got wrong with Pancho";
const TEAM_DOG_IMAGE = asset("images/Pancho-2edition.png");

export function useDogImages() {
  const [images, setImages] = useState([STATIC_DOG_IMAGE, TEAM_DOG_IMAGE]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  const { isOnline, offline } = useOnlineStatus(reload);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadPanchoDogs() {
      if (!isOnline) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");

      try {
        const [result] = await Promise.all([
          getDachshunds(controller.signal),
          wait(MIN_LOADING_MS),
        ]);

        if (!active) return;
        if (result.images.length < 1) {
          setImages([STATIC_DOG_IMAGE, TEAM_DOG_IMAGE]);
          setError(ERROR_MESSAGE);
        } else {
          setImages([STATIC_DOG_IMAGE, TEAM_DOG_IMAGE])
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

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadToken, reload, isOnline]);

  return { images, loading, error, offline, fromCache, reload };
}