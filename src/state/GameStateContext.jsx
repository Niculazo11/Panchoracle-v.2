import { createContext, useContext, useSyncExternalStore, useCallback, useMemo, useState, useEffect } from "react";
import { fetchGameState, choosePancho, buyCosmetic, equipCosmetic } from "../lib/gameApi.js";
import { defaultState } from "./defaults.js";

// Bridges the server-side GameState into React's render cycle.
// UN-303: All actions are now async API calls; no optimistic updates.
// State is fetched from server on init and after each action.
const GameStateReactContext = createContext(null);

// Subscribe function for useSyncExternalStore - we use a simple in-memory store with listeners
function createStore(initialState) {
    const listeners = new Set();
    let state = initialState;

    return {
        getState: () => state,
        setState: (newState) => {
            state = newState;
            listeners.forEach((fn) => fn(state));
        },
        subscribe: (fn) => {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
    };
}

// Create the store lazily (will be initialized in provider)
let gameStore = null;

function getStore() {
    if (!gameStore) {
        gameStore = createStore(null);
    }
    return gameStore;
}

export function GameStateProvider({ children, initialState }) {
    const store = getStore();
    const [, forceUpdate] = useState(0);

    // Initialize state from server on first mount (or use initialState if provided for SSR)
    useEffect(() => {
        if (!store.getState()) {
            if (initialState) {
                store.setState(initialState);
            } else {
                // Fetch from server
                fetchGameState()
                    .then((serverState) => store.setState(serverState))
                    .catch((err) => {
                        console.error("Failed to fetch initial game state:", err);
                        // Fallback to default state for the current user
                        // We can't easily get username here without auth context, so use defaults
                        store.setState(defaultState("guest"));
                    });
            }
        }
    }, [initialState]);

    // Subscribe to store changes for useSyncExternalStore
    const subscribe = useCallback((callback) => store.subscribe(callback), []);
    const getSnapshot = useCallback(() => store.getState(), []);

    const state = useSyncExternalStore(subscribe, getSnapshot);

    // Async action wrappers that update local store with server response
    const doChoosePancho = useCallback(async (id, imgUrl) => {
        const result = await choosePancho(id, imgUrl);
        store.setState(result);
        return result;
    }, []);

    const doBuyCosmetic = useCallback(async (cosmetic) => {
        try {
            const result = await buyCosmetic(cosmetic.id);
            store.setState(result);
            return { success: true, message: `You bought "${cosmetic.name}"!` };
        } catch (err) {
            return { success: false, message: err.message || "Could not buy item." };
        }
    }, []);

    const doEquipCosmetic = useCallback(async (cosmeticId, slot) => {
        try {
            const result = await equipCosmetic(cosmeticId, slot);
            store.setState(result);
            return { success: true, message: "Equipped!" };
        } catch (err) {
            return { success: false, message: err.message || "Could not equip item." };
        }
    }, []);

    // Note: tick() is removed - hunger decay is now handled by server polling (usePolling)
    // kept for backwards compatibility but does nothing
    const doTick = useCallback(() => {
        // No-op: hunger decay handled by server polling
        return { success: true, state: store.getState() };
    }, []);

    const doInit = useCallback(async (username) => {
        const result = await fetchGameState();
        store.setState(result);
        return result;
    }, []);

    // Without this, every consumer of useGameState() re-renders whenever
    // GameStateProvider's parent re-renders (e.g. on route navigation),
    // even if the actual game state didn't change — because a brand new
    // `value` object was handed to the context either way.
    const value = useMemo(() => ({
        state,
        dog: state?.dog,
        student: state?.student,
        currentAssignment: state?.currentAssignment,
        choosePancho: doChoosePancho,
        buyCosmetic: doBuyCosmetic,
        equipCosmetic: doEquipCosmetic,
        tick: doTick,
        init: doInit,
    }), [
        state,
        doChoosePancho,
        doBuyCosmetic,
        doEquipCosmetic,
        doTick,
        doInit,
    ]);

    return (
        <GameStateReactContext.Provider value={value}>
            {children}
        </GameStateReactContext.Provider>
    );
}

export function useGameState() {
    const ctx = useContext(GameStateReactContext);

    if (!ctx) {
        throw new Error("useGameState must be used within a GameStateProvider");
    }

    return ctx;
}