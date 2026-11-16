import { api } from "./api.js";

// Game state API calls for UN-303 migration
// All actions are now async and wait for server response (no optimistic updates)

export async function fetchGameState() {
    const res = await api.get("/me/game");
    return res;
}

export async function choosePancho(panchoId, imgUrl) {
    const res = await api.put("/pets/me/pancho", { panchoId, imgUrl });
    return res;
}

export async function completeStep(assignmentId, stepId) {
    const res = await api.post(`/assignments/${assignmentId}/steps`, { stepId });
    return res;
}

export async function submitAssignment(assignmentId) {
    const res = await api.post(`/assignments/${assignmentId}/submit`);
    return res;
}

export async function buyCosmetic(cosmeticId) {
    const res = await api.post("/pets/me/inventory", { cosmeticId });
    return res;
}

export async function equipCosmetic(cosmeticId, slot) {
    const res = await api.put("/pets/me/equipped", { [slot]: cosmeticId });
    return res;
}

export async function awardMinigameCoins(correctCount) {
    const res = await api.post("/minigames/reward", { correctCount });
    return res;
}