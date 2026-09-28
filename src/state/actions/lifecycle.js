"use strict";

import {
    clamp,
    HEALTH_PENALTY_WHEN_STARVING,
    HUNGER_DECAY_PER_TICK
} from "../constants.js";

// Returns a new dog object with the starvation penalty applied.
function applyHungerPenalty(dog) {

    let next = dog;

    if (next.hunger <= 0) {
        next = {
            ...next,
            hunger: 0,
            health: clamp(next.health - HEALTH_PENALTY_WHEN_STARVING, 0, 100)
        };
    }

    if (next.health <= 0) {
        next = { ...next, health: 0, status: "DEAD" };
    }

    return next;
}

// Passive hunger decay over time (or an overdue assignment). If hunger
// is already at 0, health decays instead; if health reaches 0, Pancho's
// status becomes "DEAD". Returns a new state, or null when nothing
// changed (Pancho is already dead).
export function tick(state) {

    const dog = state.dog;

    if (dog.status === "DEAD") {
        return null;
    }

    const hunger = clamp(dog.hunger - HUNGER_DECAY_PER_TICK, 0, 100);

    return { ...state, dog: applyHungerPenalty({ ...dog, hunger }) };
}
