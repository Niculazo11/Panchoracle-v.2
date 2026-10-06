"use strict";

import { MINIGAME_REWARD_COINS } from "../constants.js";

// Minigames (src/pages/minigames/) are the ONLY place coins are earned
// directly for play rather than for academic progress — assignments
// only restore Hunger (see actions/assignment.js). `correctCount` is
// capped against the max per-minigame reward so a custom/future
// minigame can't exceed the documented +coins-per-minigame rate (see
// the "How do i obtain coins?" FAQ answer in pages/about/faqItems.jsx).
export function awardMinigameCoins(state, correctCount) {

    if (!Number.isFinite(correctCount) || correctCount <= 0) {
        return { success: false, message: "No coins earned this round." };
    }

    const reward = Math.min(correctCount, MINIGAME_REWARD_COINS);
    const { student } = state;

    return {
        success: true,
        reward,
        message: `You earned ${reward} coin${reward === 1 ? "" : "s"} for completing the minigame!`,
        state: {
            ...state,
            student: {
                ...student,
                coins: student.coins + reward,
                minigamesCompleted: (student.minigamesCompleted || 0) + 1
            }
        }
    };
}
