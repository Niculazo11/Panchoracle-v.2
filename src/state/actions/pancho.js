"use strict";

import { defaultAssignment } from "../defaults.js";

// 1. Pancho selection (called from the ChoosePancho flow).
// Returns { success, state } with a brand new state object: nothing in
// the previous state is mutated.
export function choosePancho(state, id, imgUrl) {

    if (!imgUrl) {
        return { success: false, message: "No valid Pancho image was received." };
    }

    return {
        success: true,
        state: {
            ...state,
            dog: {
                ...state.dog,
                id,
                imgUrl,
                health: 100,
                hunger: 100,
                status: "ALIVE"
            },
            currentAssignment: defaultAssignment()
        }
    };
}
