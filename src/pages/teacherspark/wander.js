// Where and how a park dog walks around (UN-401). Positions are percentages of the park area.
export const WANDER_BOUNDS = { minX: 10, maxX: 90, minY: 34, maxY: 88 };

const MIN_STEP = 6; // shortest walk
const MAX_STEP = 20; // longest walk
const SPEED = 4; // how much of the park a dog crosses per second
const MIN_SECONDS = 0.5;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Moves one coordinate by `delta`. A step that would leave the park bounces back from
// the edge instead, so dogs do not pile up against the walls.
function stepInside(from, delta, min, max) {
    let value = from + delta;

    if (value < min || value > max) {
        value = from - delta;
    }

    return clamp(value, min, max);
}

// Picks the next spot: a short walk in a random direction, kept inside the park.
// Returns { x, y, seconds }, where seconds is how long the walk takes.
export function nextWanderTarget(from, random = Math.random) {
    const angle = random() * 2 * Math.PI;
    const length = MIN_STEP + random() * (MAX_STEP - MIN_STEP);

    // The park is about twice as wide as it is tall, so vertical walks are shorter.
    const x = stepInside(from.x, Math.cos(angle) * length, WANDER_BOUNDS.minX, WANDER_BOUNDS.maxX);
    const y = stepInside(from.y, Math.sin(angle) * length * 0.5, WANDER_BOUNDS.minY, WANDER_BOUNDS.maxY);

    const distance = Math.hypot(x - from.x, (y - from.y) * 2);

    return { x, y, seconds: Math.max(distance / SPEED, MIN_SECONDS) };
}
