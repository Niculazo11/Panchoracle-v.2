"use strict";

import { clamp, SUBMIT_REWARDS } from "../constants.js";
import { defaultAssignment } from "../defaults.js";

// Steps 1-3 only mark progress on the checklist — they never touch
// hunger or health. Every update rebuilds the affected objects instead
// of mutating them (steps are copied with map + spread).
export function completeStep(state, stepId) {

    const assignment = state.currentAssignment;

    if (state.dog.status === "DEAD") {
        return { success: false, message: "Pancho can't work on assignments right now." };
    }

    if (stepId === 4) {
        return submitAssignment(state);
    }

    const step = assignment.steps.find((s) => s.id === stepId);

    if (!step) {
        return { success: false, message: "That step doesn't exist." };
    }

    if (step.completed) {
        return { success: false, message: "This step is already completed." };
    }

    const steps = assignment.steps.map((s) =>
        s.id === stepId ? { ...s, completed: true } : s
    );

    return {
        success: true,
        step: { ...step, completed: true },
        state: { ...state, currentAssignment: { ...assignment, steps } }
    };
}

// Step 4: "Feed Pancho (Submit Assignment)". Only allowed once steps
// 1-3 are completed. Rewards Hunger ONLY (never Health or Coins), then
// resets the checklist and bumps the lifetime counter used by stats.
export function submitAssignment(state) {

    const { dog, student, currentAssignment: assignment } = state;

    if (dog.status === "DEAD") {
        return { success: false, message: "Pancho can't submit an assignment right now." };
    }

    const prepStepsDone = assignment.steps
        .filter((s) => s.id !== 4)
        .every((s) => s.completed);

    if (!prepStepsDone) {
        return { success: false, message: "Complete steps 1-3 before submitting the assignment." };
    }

    return {
        success: true,
        rewards: SUBMIT_REWARDS,
        state: {
            ...state,
            dog: { ...dog, hunger: clamp(dog.hunger + SUBMIT_REWARDS.hunger, 0, 100) },
            student: {
                ...student,
                assignmentsCompleted: (student.assignmentsCompleted || 0) + 1
            },
            currentAssignment: defaultAssignment(assignment.id)
        }
    };
}
