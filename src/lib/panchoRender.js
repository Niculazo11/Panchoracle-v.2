"use strict";

// ---------------------------------------------------------------------
// panchoRender.js (React port)
// ---------------------------------------------------------------------
// Shared constants between the dashboard (RaisePancho) and the shop
// (Shop) to paint the selected Pancho with its equipped cosmetics
// stacked in layers (#pancho-container). The original DOM-painting
// function (renderPanchoLayers) is now the <PanchoLayers /> component
// in src/components/PanchoLayers.jsx — these constants are unchanged.
//
// IMPORTANT — placeholders: the final cosmetic sprites don't exist yet,
// so each slot temporarily uses an icon already present in /images as a
// placeholder. This only proves the stacking technique; once the real
// sprites exist, just swap the paths in PLACEHOLDER_BY_SLOT.
// ---------------------------------------------------------------------

// The dataset (src/data/dataset.json) uses "category" (Head/Face/Neck/Body).
// GameState uses the same names lower-cased as slot keys for
// dog.equippedCosmetics. This map connects both.
export const CATEGORY_TO_SLOT = {
    Head: "head",
    Face: "face",
    Neck: "neck",
    Body: "body"
};

export const SLOT_TO_CATEGORY = Object.fromEntries(
    Object.entries(CATEGORY_TO_SLOT).map(([category, slot]) => [slot, category])
);

// Temporary placeholders taken from the already-existing images/ folder.
export const PLACEHOLDER_BY_SLOT = {
    head: "/images/paw.png",
    face: "/images/circulito.png",
    neck: "/images/LogoPatita.png",
    body: "/images/PlayingCards.png"
};

// z-index per layer: head always renders on top, body underneath, as
// requested (head 10 / neck 5), with face and body interleaved in the
// same scheme.
export const SLOT_Z_INDEX = {
    body: 2,
    neck: 5,
    face: 8,
    head: 10
};

// Rough positioning for each layer inside the container, so the
// placeholder "lands" on the part of the body it corresponds to.
export const SLOT_POSITION_CLASSES = {
    body: "inset-0 w-full h-full object-contain opacity-90",
    neck: "w-1/3 h-1/3 top-[46%] left-1/2 -translate-x-1/2 object-contain",
    face: "w-1/4 h-1/4 top-[22%] left-1/2 -translate-x-1/2 object-contain",
    head: "w-1/3 h-1/3 top-[2%] left-1/2 -translate-x-1/2 object-contain"
};

// Slot render order (bottom to top), used so equipped layers mount in a
// stable DOM order matching their z-index intent.
export const SLOT_ORDER = ["body", "neck", "face", "head"];
