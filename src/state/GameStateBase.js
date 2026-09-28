"use strict";

import { loadState, persistState, resolveUsername } from "./storage.js";

// Core of the GameState singleton: loading, saving and notifying.
// The gameplay actions live in gameState.js (which extends this class)
// and in state/actions/*, so no file grows past the size limit.
export class GameStateBase {

    constructor() {
        this.username = null;
        this.state = null;
        this._listeners = [];
    }

    // Loads the given user's state (or the currently logged-in user, or
    // "guest" as a last resort), creating defaults when there is none.
    init(username) {
        this.username = resolveUsername(username);
        this.state = loadState(this.username);
        this._save();
        return this.state;
    }

    getState() {
        return this.state;
    }

    _save() {
        if (!this.username) {
            return;
        }

        persistState(this.username, this.state);
        this._emit();
    }

    // Lets any module subscribe to changes without depending on
    // CustomEvent. React uses this through useSyncExternalStore.
    onChange(callback) {
        this._listeners.push(callback);

        return () => {
            this._listeners = this._listeners.filter(function (fn) {
                return fn !== callback;
            });
        };
    }

    _emit() {
        this._listeners.forEach(function (fn) { fn(this.state); }, this);

        if (typeof document !== "undefined") {
            document.dispatchEvent(
                new CustomEvent("gamestate:change", { detail: this.state })
            );
        }
    }

    // Every action returns a brand new state object. Swapping the
    // reference (instead of mutating in place) is what lets
    // useSyncExternalStore detect the change and re-render, and it keeps
    // the previous snapshot intact for anyone still holding it.
    _run(result) {
        if (result && result.success && result.state) {
            this.state = result.state;
            this._save();
        }

        return result;
    }
}
