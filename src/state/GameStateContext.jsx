import { createContext, useContext, useSyncExternalStore, useCallback } from "react";
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

    const value = {
        state,
        dog: state.dog,
        student: state.student,
        currentAssignment: state.currentAssignment,
        choosePancho: useCallback((id, imgUrl) => GameState.choosePancho(id, imgUrl), []),
        completeStep: useCallback((stepId) => GameState.completeStep(stepId), []),
        submitAssignment: useCallback(() => GameState.submitAssignment(), []),
        buyCosmetic: useCallback((cosmetic) => GameState.buyCosmetic(cosmetic), []),
        equipCosmetic: useCallback((cosmeticId, slot) => GameState.equipCosmetic(cosmeticId, slot), []),
        tick: useCallback(() => GameState.tick(), []),
        init: useCallback((username) => GameState.init(username), []),
    };

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
