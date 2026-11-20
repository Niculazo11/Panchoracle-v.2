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

// UN-501: Quiz minigame - Server-side grading
export async function fetchQuizQuestions() {
    const res = await api.get("/minigames/quiz");
    return res.questions;
}

export async function submitQuiz(answers) {
    const res = await api.post("/minigames/quiz/submit", { answers });
    return res;
}


// UN-303 RF-5: Fetch cosmetics catalog from server (replaces local catalog.js)
export async function fetchCosmetics() {
    const res = await api.get("/cosmetics");
    // Server returns: { cosmetics: [{ cosmeticId, name, category, cost, image }] }
    return (res.cosmetics ?? []).map((item) => ({
        ...item,
        id: item.id ?? item.cosmeticId,
    }));
}

// UN-XXX: Fetch minigames assigned to the student by their teacher
export async function fetchAssignedMinigames() {
    const res = await api.get("/minigames/assigned");
    // Server returns: { assignments: [{ _id, minigameId, name, description, assignedAt }] }
    return res.assignments;
}