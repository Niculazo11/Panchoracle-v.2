// Game constants shared by the server (UN-301). They mirror src/state/constants.js and
// src/state/defaults.js so the server applies the same rules the prototype client used.

// Coins a new Pancho starts with (ADR section 12 left it open; same value as the client).
export const STARTING_COINS = 270;

export const SLOTS = ["head", "face", "neck", "body"];

// Cosmetic "category" (as stored in cosmetics) -> equipment slot (ADR 6.11).
export const SLOT_BY_CATEGORY = { Head: "head", Face: "face", Neck: "neck", Body: "body" };

// Used when the student has no classroom or the classroom has no active assignment.
// Must be a valid ObjectId (24 hex chars) to pass validateIds middleware.
export const DEFAULT_ASSIGNMENT = { id: "000000000000000000000001", title: "Java REST Controller Task" };

// Minigame reward limits (UN-303 stop-gap until UN-501 grades the quiz on the server).
// ADR section 12 leaves the cap and the cooldown open; these are proposed values, and can be
// changed with the MINIGAME_COOLDOWN_MS and MINIGAME_MAX_PLAYS_PER_DAY environment variables.
export const MINIGAME_MAX_COINS_PER_PLAY = 5;
export function minigameLimits() {
  return {
    cooldownMs: Number(process.env.MINIGAME_COOLDOWN_MS ?? 30_000),
    maxPlaysPerDay: Number(process.env.MINIGAME_MAX_PLAYS_PER_DAY ?? 10),
  };
}