import { useEffect, useState, useCallback } from "react";

export function useOnlineStatus(onOnline) {
  const [offline, setOffline] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setOffline("Internet connection lost");
  }, []);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setOffline("");
    onOnline?.();
  }, [onOnline]);

  useEffect(() => {
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [handleOffline, handleOnline]);

  return { isOnline, offline };
}