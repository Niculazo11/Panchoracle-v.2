"use strict";

// Shared constants of the GameState module (extracted from the original
// gameState.js, unchanged in value and meaning).

export const CURRENT_USER_KEY = "name"; // same key used by the join form
export const STATE_PREFIX = "panchoGameState_";
export const STARTING_COINS = 270;

// Cosmetic slots supported. These map 1:1 to the dataset "category"
// values (Head/Face/Neck/Body) via CATEGORY_TO_SLOT in panchoRender.js.
export const EMPTY_EQUIPPED = { head: null, face: null, neck: null, body: null };

// The 4 simulated stages of the assignment the teacher left for the
// class: a checklist that tracks progress on the current homework.
export const ASSIGNMENT_STEP_LABELS = [
    "Go for a Walk (Research)",
    "Play in the Park (Brainstorming)",
    "Study Together (Drafting Task)",
    "Feed Pancho (Submit Assignment)"
];

// Rewards granted when the final step (Submit Assignment) is completed.
// Assignments ONLY restore Hunger — never Health or Coins directly.
// Coins are an exclusive mechanic of the Minigames section.
export const SUBMIT_REWARDS = { hunger: 30 };

// Message shown on the UI when Pancho's status becomes "DEAD".
export const DEAD_STATUS_MESSAGE =
    "Pancho is unadapted/sick, submit assignments to keep him healthy!";

// Passive decay per tick (time passing / an overdue assignment).
export const HUNGER_DECAY_PER_TICK = 2;
export const HEALTH_PENALTY_WHEN_STARVING = 10;

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
