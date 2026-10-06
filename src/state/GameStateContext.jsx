import { createContext, useContext, useSyncExternalStore, useCallback, useMemo } from "react";
import { GameState } from "./gameState.js";

// Bridges the GameState singleton (unchanged business logic ported from
// js/gameState.js) into React's render cycle. Every component that reads
// GameState.getState() through this context re-renders automatically
// whenever GameState._save() fires a change — this replaces the manual
// document.addEventListener("gamestate:change", ...) wiring every page
// used to do by hand.
const GameStateReactContext = createContext(null);

function subscribe(callback) {
    return GameState.onChange(callback);
}

function getSnapshot() {
    return GameState.getState();
}

export function GameStateProvider({ children }) {
    // Ensure the singleton is initialized before first read (mirrors the
    // original GameState.init() call at the top of every page's script).
    if (!GameState.getState()) {
        GameState.init();
    }

    const state = useSyncExternalStore(subscribe, getSnapshot);

    // Stable across every render (empty deps), so they're safe to list in
    // the useMemo deps below without ever invalidating it themselves.
    const choosePancho = useCallback((id, imgUrl) => GameState.choosePancho(id, imgUrl), []);
    const completeStep = useCallback((stepId) => GameState.completeStep(stepId), []);
    const submitAssignment = useCallback(() => GameState.submitAssignment(), []);
    const buyCosmetic = useCallback((cosmetic) => GameState.buyCosmetic(cosmetic), []);
    const equipCosmetic = useCallback((cosmeticId, slot) => GameState.equipCosmetic(cosmeticId, slot), []);
    const tick = useCallback(() => GameState.tick(), []);
    const init = useCallback((username) => GameState.init(username), []);
    const awardMinigameCoins = useCallback((correctCount) => GameState.awardMinigameCoins(correctCount), []);

    // Without this, every consumer of useGameState() re-renders whenever
    // GameStateProvider's parent re-renders (e.g. on route navigation),
    // even if the actual game state didn't change — because a brand new
    // `value` object was handed to the context either way.
    const value = useMemo(() => ({
        state,
        dog: state.dog,
        student: state.student,
        currentAssignment: state.currentAssignment,
        choosePancho,
        completeStep,
        submitAssignment,
        buyCosmetic,
        equipCosmetic,
        tick,
        init,
        awardMinigameCoins,
    }), [state, choosePancho, completeStep, submitAssignment, buyCosmetic, equipCosmetic, tick, init, awardMinigameCoins]);

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
