// Single source of "now" for the game rules (ADR 5.3: the server clock decides, never the
// client). Tests replace `clock.now` to simulate days passing without waiting.
export const clock = { now: () => Date.now() };
