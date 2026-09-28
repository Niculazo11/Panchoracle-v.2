"use strict";

import {
    ASSIGNMENT_STEP_LABELS,
    EMPTY_EQUIPPED,
    STARTING_COINS
} from "./constants.js";

function buildAssignmentSteps() {
    return ASSIGNMENT_STEP_LABELS.map(function (label, index) {
        return { id: index + 1, label, completed: false };
    });
}

export function defaultAssignment(previousId) {

    const match = previousId ? /(\d+)$/.exec(previousId) : null;
    const nextNumber = match ? String(Number(match[1]) + 1).padStart(2, "0") : "01";

    return {
        id: `assign_${nextNumber}`,
        title: "Java REST Controller Task",
        steps: buildAssignmentSteps()
    };
}

export function defaultStudent(username) {
    return {
        id: username,
        coins: STARTING_COINS,
        inventory: [],
        assignmentsCompleted: 0 // lifetime counter, shown on PanchoStats
    };
}

export function defaultDog() {
    return {
        id: null,
        name: "Pancho",
        imgUrl: null,
        health: 100,
        hunger: 100,
        status: "ALIVE", // "ALIVE" | "DEAD"
        equippedCosmetics: { ...EMPTY_EQUIPPED }
    };
}

export function defaultState(username) {
    return {
        student: defaultStudent(username),
        dog: defaultDog(),
        currentAssignment: defaultAssignment()
    };
}

// Back-fills any field missing from an older (or partially corrupted)
// save, always returning a new object instead of patching the parsed one.
export function normalizeState(parsed, user) {

    const base = defaultState(user);
    const saved = parsed && typeof parsed === "object" ? parsed : {};
    const student = saved.student || {};
    const dog = saved.dog || {};

    return {
        student: {
            ...base.student,
            ...student,
            inventory: Array.isArray(student.inventory) ? [...student.inventory] : [],
            assignmentsCompleted: student.assignmentsCompleted || 0
        },
        dog: {
            ...base.dog,
            ...dog,
            equippedCosmetics: { ...EMPTY_EQUIPPED, ...(dog.equippedCosmetics || {}) }
        },
        currentAssignment: saved.currentAssignment || base.currentAssignment
    };
}
