// Game constants shared by the server (UN-301). They mirror src/state/constants.js and
// src/state/defaults.js so the server applies the same rules the prototype client used.

// Coins a new Pancho starts with (ADR section 12 left it open; same value as the client).
export const STARTING_COINS = 270;

export const SLOTS = ["head", "face", "neck", "body"];

// Cosmetic "category" (as stored in cosmetics) -> equipment slot (ADR 6.11).
export const SLOT_BY_CATEGORY = { Head: "head", Face: "face", Neck: "neck", Body: "body" };

// Used when the student has no classroom or the classroom has no active assignment.
export const DEFAULT_ASSIGNMENT = { id: "assign_01", title: "Java REST Controller Task" };

// The 4 steps of the checklist (state/constants.js). Progress is tracked by UN-302.
export const STEP_LABELS = [
  "Go for a Walk (Research)",
  "Play in the Park (Brainstorming)",
  "Study Together (Drafting Task)",
  "Feed Pancho (Submit Assignment)",
];
