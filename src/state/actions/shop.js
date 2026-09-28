"use strict";

// 4. Shop / inventory / equipping. Both actions return a fresh state
// object; the inventory array and the equippedCosmetics map are copied,
// never pushed into or assigned in place.
export function buyCosmetic(state, cosmetic) {

    const student = state.student;

    if (student.inventory.some((id) => id === cosmetic.id)) {
        return { success: false, message: "You already own that cosmetic." };
    }

    if (student.coins < cosmetic.cost) {
        return { success: false, message: "Not enough coins." };
    }

    return {
        success: true,
        message: `You purchased "${cosmetic.name}".`,
        state: {
            ...state,
            student: {
                ...student,
                coins: student.coins - cosmetic.cost,
                inventory: [...student.inventory, cosmetic.id]
            }
        }
    };
}

// slot must be one of the equippedCosmetics keys (head/face/neck/body).
// Pass cosmeticId = null to unequip.
export function equipCosmetic(state, cosmeticId, slot) {

    const { student, dog } = state;

    if (!(slot in dog.equippedCosmetics)) {
        return { success: false, message: "Invalid cosmetic slot." };
    }

    if (cosmeticId !== null && !student.inventory.includes(cosmeticId)) {
        return { success: false, message: "That cosmetic isn't in your inventory yet." };
    }

    return {
        success: true,
        state: {
            ...state,
            dog: {
                ...dog,
                equippedCosmetics: { ...dog.equippedCosmetics, [slot]: cosmeticId }
            }
        }
    };
}
