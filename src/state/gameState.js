"use strict";

// ---------------------------------------------------------------------
// GameState
// ---------------------------------------------------------------------
// Single source of truth for the student and their Pancho. The data
// shape, field names and calculations are unchanged from the original
// vanilla gameState.js: only the file layout changed, so persistence
// lives in GameStateBase/storage.js and each gameplay rule in
// state/actions/*.
// ---------------------------------------------------------------------

import { GameStateBase } from "./GameStateBase.js";
import * as panchoActions from "./actions/pancho.js";
import * as assignmentActions from "./actions/assignment.js";
import * as lifecycleActions from "./actions/lifecycle.js";
import * as shopActions from "./actions/shop.js";

class GameStateManager extends GameStateBase {

    choosePancho(id, imgUrl) {
        return this._run(panchoActions.choosePancho(this.state, id, imgUrl));
    }

    completeStep(stepId) {
        return this._run(assignmentActions.completeStep(this.state, stepId));
    }

    submitAssignment() {
        return this._run(assignmentActions.submitAssignment(this.state));
    }

    buyCosmetic(cosmetic) {
        return this._run(shopActions.buyCosmetic(this.state, cosmetic));
    }

    equipCosmetic(cosmeticId, slot) {
        return this._run(shopActions.equipCosmetic(this.state, cosmeticId, slot));
    }

    // Passive decay: tick() returns null when nothing changed.
    tick() {
        const nextState = lifecycleActions.tick(this.state);

        if (nextState) {
            this.state = nextState;
            this._save();
        }
    }
}

export const GameState = new GameStateManager();

export {
    EMPTY_EQUIPPED,
    ASSIGNMENT_STEP_LABELS,
    SUBMIT_REWARDS,
    DEAD_STATUS_MESSAGE
} from "./constants.js";
