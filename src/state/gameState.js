"use strict";

// ---------------------------------------------------------------------
// GameState
// ---------------------------------------------------------------------
// Single source of truth for the student and their Pancho. Syncs
// automatically to localStorage on every change (one key per user,
// reusing the same "name" key dogApi.js already writes).
//
// This is a direct port of the original vanilla js/gameState.js: the
// data shape, field names and calculations are unchanged. The only
// difference is that React components subscribe to it through
// GameStateContext.jsx (useSyncExternalStore) instead of listening to
// the "gamestate:change" DOM event by hand.
// ---------------------------------------------------------------------

const CURRENT_USER_KEY = "name"; // same key already used by the join form / dogApi.js
const STATE_PREFIX = "panchoGameState_";
const STARTING_COINS = 270;

// Cosmetic slots supported. These map 1:1 to the dataset "category"
// values (Head/Face/Neck/Body) via CATEGORY_TO_SLOT in panchoRender.js.
const EMPTY_EQUIPPED = { head: null, face: null, neck: null, body: null };

// The 4 simulated stages of the assignment the teacher left for the
// class. These are NOT independent actions that drain hunger — they are
// a checklist that tracks progress on the current homework.
const ASSIGNMENT_STEP_LABELS = [
    "Go for a Walk (Research)",
    "Play in the Park (Brainstorming)",
    "Study Together (Drafting Task)",
    "Feed Pancho (Submit Assignment)"
];

// Rewards granted when the final step (Submit Assignment) is completed.
// NOTE: Academic assignments from the teacher ONLY restore Pancho's
// Hunger — never Health directly. Health only ever recovers as a side
// effect of Hunger being kept above 0 (see tick()/_applyHungerPenalty()
// below): submitting an assignment refuels Hunger, which in turn stops
// (and lets you avoid) the passive Health penalty that kicks in once
// Hunger hits 0. Coins are intentionally NOT part of this reward either
// — earning Coins is an exclusive mechanic reserved for the Minigames
// section (see MiniGames.html / a future minigames.js module), so a
// student can't grind coins just by clicking through homework steps.
const SUBMIT_REWARDS = { hunger: 30 };

// Message shown on the UI when Pancho's status becomes "DEAD" (Health
// reached 0). Exported so any page can reuse the exact same copy.
const DEAD_STATUS_MESSAGE = "Pancho is unadapted/sick, submit assignments to keep him healthy!";

// How much hunger drops, and how much health is penalized once hunger
// hits 0, on every passive "tick" (time passing / an overdue assignment).
// Hunger and health never move just because a checklist step was clicked.
const HUNGER_DECAY_PER_TICK = 2;
const HEALTH_PENALTY_WHEN_STARVING = 10;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function buildAssignmentSteps() {
    return ASSIGNMENT_STEP_LABELS.map(function (label, index) {
        return { id: index + 1, label, completed: false };
    });
}

function defaultAssignment(previousId) {

    const match = previousId ? /(\d+)$/.exec(previousId) : null;
    const nextNumber = match ? String(Number(match[1]) + 1).padStart(2, "0") : "01";

    return {
        id: `assign_${nextNumber}`,
        title: "Java REST Controller Task",
        steps: buildAssignmentSteps()
    };
}

function defaultState(username) {
    return {
        student: {
            id: username,
            coins: STARTING_COINS,
            inventory: [],
            assignmentsCompleted: 0 // lifetime counter, shown on panchoStats.html
        },
        dog: {
            id: null,
            name: "Pancho",
            imgUrl: null,
            health: 100,
            hunger: 100,
            status: "ALIVE", // "ALIVE" | "DEAD"
            equippedCosmetics: Object.assign({}, EMPTY_EQUIPPED)
        },
        currentAssignment: defaultAssignment()
    };
}

class GameStateManager {

    constructor() {
        this.username = null;
        this.state = null;
        this._listeners = [];
    }

    _key() {
        return STATE_PREFIX + this.username;
    }

    // Loads the given user's state (or the currently logged-in user, or
    // "guest" as a last resort) from localStorage, creating a fresh one
    // with default values if none exists yet.
    init(username) {

        const user = username || localStorage.getItem(CURRENT_USER_KEY) || "guest";
        this.username = user;

        const raw = localStorage.getItem(this._key());

        if (raw) {
            try {
                const parsed = JSON.parse(raw);

                // Defensive: back-fill any fields missing from an older save.
                parsed.dog = parsed.dog || {};
                parsed.dog.equippedCosmetics = Object.assign(
                    {},
                    EMPTY_EQUIPPED,
                    parsed.dog.equippedCosmetics || {}
                );
                parsed.student = parsed.student || { id: user, coins: STARTING_COINS, inventory: [], assignmentsCompleted: 0 };
                parsed.student.inventory = parsed.student.inventory || [];
                parsed.student.assignmentsCompleted = parsed.student.assignmentsCompleted || 0;
                parsed.currentAssignment = parsed.currentAssignment || defaultAssignment();

                this.state = parsed;
            } catch (error) {
                console.error("GameState was corrupted, resetting:", error);
                this.state = defaultState(user);
            }
        } else {
            this.state = defaultState(user);
        }

        this._save();
        return this.state;
    }

    _save() {
        if (!this.username) {
            return;
        }

        localStorage.setItem(this._key(), JSON.stringify(this.state));
        this._emit();
    }

    // Lets any module subscribe to changes without depending on
    // CustomEvent (handy for non-DOM code or tests). React components
    // use this through useSyncExternalStore in GameStateContext.jsx.
    onChange(callback) {
        this._listeners.push(callback);

        // Return an unsubscribe function for React's effect cleanup.
        return () => {
            this._listeners = this._listeners.filter(function (fn) {
                return fn !== callback;
            });
        };
    }

    _emit() {
        this._listeners.forEach(function (fn) {
            fn(this.state);
        }, this);

        if (typeof document !== "undefined") {
            document.dispatchEvent(new CustomEvent("gamestate:change", { detail: this.state }));
        }
    }

    getState() {
        return this.state;
    }

    // -------------------------------------------------------------
    // 1. Pancho selection (called from the choosePancho flow)
    // -------------------------------------------------------------
    choosePancho(id, imgUrl) {

        if (!imgUrl) {
            return { success: false, message: "No valid Pancho image was received." };
        }

        const dog = this.state.dog;

        dog.id = id;
        dog.imgUrl = imgUrl;
        dog.health = 100;
        dog.hunger = 100;
        dog.status = "ALIVE";

        this.state.currentAssignment = defaultAssignment();

        this._save();
        return { success: true };
    }

    // -------------------------------------------------------------
    // 2. Assignment workflow (steps 1-3) + 3. Submission (step 4)
    // -------------------------------------------------------------
    // Steps 1-3 only mark progress on the checklist — they never touch
    // hunger or health. Hunger/health decay purely passively (see tick()).
    completeStep(stepId) {

        const dog = this.state.dog;
        const assignment = this.state.currentAssignment;

        if (dog.status === "DEAD") {
            return { success: false, message: "Pancho can't work on assignments right now." };
        }

        if (stepId === 4) {
            return this.submitAssignment();
        }

        const step = assignment.steps.find(function (s) { return s.id === stepId; });

        if (!step) {
            return { success: false, message: "That step doesn't exist." };
        }

        if (step.completed) {
            return { success: false, message: "This step is already completed." };
        }

        step.completed = true;
        this._save();

        return { success: true, step };
    }

    // Step 4: "Feed Pancho (Submit Assignment)". Only allowed once steps
    // 1-3 are completed. Rewards Pancho with Hunger ONLY — Health is
    // never granted directly by an assignment (no Coins either; Coins
    // are earned exclusively through Minigames) — then resets the
    // checklist for the next assignment and bumps the student's
    // lifetime "assignments completed" counter (used by panchoStats.html).
    submitAssignment() {

        const dog = this.state.dog;
        const student = this.state.student;
        const assignment = this.state.currentAssignment;

        if (dog.status === "DEAD") {
            return { success: false, message: "Pancho can't submit an assignment right now." };
        }

        const prepStepsDone = assignment.steps
            .filter(function (s) { return s.id !== 4; })
            .every(function (s) { return s.completed; });

        if (!prepStepsDone) {
            return { success: false, message: "Complete steps 1-3 before submitting the assignment." };
        }

        const finalStep = assignment.steps.find(function (s) { return s.id === 4; });
        if (finalStep) {
            finalStep.completed = true;
        }

        dog.hunger = clamp(dog.hunger + SUBMIT_REWARDS.hunger, 0, 100);
        // Health/Coins deliberately untouched here — assignments only
        // ever refuel Hunger. Health rises separately if/when Hunger
        // recovering means the passive starvation penalty stops firing.

        // Lifetime counter for panchoStats.html — does NOT reset with
        // the checklist below.
        student.assignmentsCompleted = (student.assignmentsCompleted || 0) + 1;

        // Ready the next assignment: fresh checklist, all steps pending.
        this.state.currentAssignment = defaultAssignment(assignment.id);

        this._save();

        return { success: true, rewards: SUBMIT_REWARDS };
    }

    // Passive hunger decay over time (or an overdue assignment). If
    // hunger is already at 0, health decays instead; if health reaches
    // 0, Pancho's status becomes "DEAD". Call periodically (setInterval)
    // from the dashboard so Pancho keeps evolving while the tab is open.
    tick() {

        const dog = this.state.dog;

        if (dog.status === "DEAD") {
            return;
        }

        dog.hunger = clamp(dog.hunger - HUNGER_DECAY_PER_TICK, 0, 100);
        this._applyHungerPenalty();
        this._save();
    }

    _applyHungerPenalty() {

        const dog = this.state.dog;

        if (dog.hunger <= 0) {
            dog.hunger = 0;
            dog.health = clamp(dog.health - HEALTH_PENALTY_WHEN_STARVING, 0, 100);
        }

        if (dog.health <= 0) {
            dog.health = 0;
            dog.status = "DEAD";
        }
    }

    // -------------------------------------------------------------
    // 4. Shop / inventory / equipping
    // -------------------------------------------------------------
    buyCosmetic(cosmetic) {

        const student = this.state.student;

        if (student.inventory.includes(cosmetic.id)) {
            return { success: false, message: "You already own that cosmetic." };
        }

        if (student.coins < cosmetic.cost) {
            return { success: false, message: "Not enough coins." };
        }

        student.coins -= cosmetic.cost;
        student.inventory.push(cosmetic.id);

        this._save();

        return { success: true, message: `You purchased "${cosmetic.name}".` };
    }

    // slot must be one of the equippedCosmetics keys (head/face/neck/body).
    // Pass cosmeticId = null to unequip.
    equipCosmetic(cosmeticId, slot) {

        const student = this.state.student;
        const dog = this.state.dog;

        if (!(slot in dog.equippedCosmetics)) {
            return { success: false, message: "Invalid cosmetic slot." };
        }

        if (cosmeticId !== null && !student.inventory.includes(cosmeticId)) {
            return { success: false, message: "That cosmetic isn't in your inventory yet." };
        }

        dog.equippedCosmetics[slot] = cosmeticId;

        this._save();

        return { success: true };
    }
}

export const GameState = new GameStateManager();
export { EMPTY_EQUIPPED, ASSIGNMENT_STEP_LABELS, SUBMIT_REWARDS, DEAD_STATUS_MESSAGE };
