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
// Each cosmetic in src/data/dataset.json now carries its own "image"
// path (see COSMETIC layer lookup in PanchoLayers.jsx). Every cosmetic
// image and the base dog image are drawn at the same canvas size, so a
// layer only needs to sit at inset-0 w-full h-full — no per-slot
// positioning is needed, they're already aligned to land correctly on
// the dog when stacked.
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

// z-index per layer: head always renders on top, body underneath, as
// requested (head 10 / neck 5), with face and body interleaved in the
// same scheme.
export const SLOT_Z_INDEX = {
    body: 2,
    neck: 5,
    face: 8,
    head: 10
};

// Every cosmetic layer (and the base dog image) fills the same
// full-bleed frame; the artwork itself is what lines things up.
export const COSMETIC_LAYER_CLASS = "inset-0 w-full h-full object-cover";

// Slot render order (bottom to top), used so equipped layers mount in a
// stable DOM order matching their z-index intent.
export const SLOT_ORDER = ["body", "neck", "face", "head"];
