import {
<<<<<<< HEAD
    SLOT_Z_INDEX,
    COSMETIC_LAYER_CLASS,
    SLOT_ORDER
} from "../lib/panchoRender.js";
import catalog from "../data/dataset.json";

// Look up a cosmetic's own record (name + image) by its id, once,
// instead of re-scanning the catalog array on every render.
const COSMETIC_BY_ID = Object.fromEntries(catalog.map((item) => [item.id, item]));
=======
    PLACEHOLDER_BY_SLOT,
    SLOT_Z_INDEX,
    SLOT_POSITION_CLASSES,
    SLOT_ORDER
} from "../lib/panchoRender.js";
>>>>>>> 913f93d391f63baac6fa9a41693b67de0185e060

// Paints Pancho's base image + the layers for any equipped cosmetics
// inside #pancho-container (position: relative). This is the JSX
// equivalent of the original renderPanchoLayers(container, dog)
// function from js/panchoRender.js — same layers, same z-index, same
<<<<<<< HEAD
// "DEAD" grayscale/overlay treatment. Each equipped slot now renders
// that specific cosmetic's own image (from dataset.json) instead of a
// shared placeholder per slot.
=======
// placeholder assets, same "DEAD" grayscale/overlay treatment.
>>>>>>> 913f93d391f63baac6fa9a41693b67de0185e060
export default function PanchoLayers({ dog }) {

    if (!dog) {
        return null;
    }

    const equipped = dog.equippedCosmetics || {};

    return (
        <>
            {/* ---- Base layer (the Pancho chosen in ChoosePancho) ---- */}
            <img
                id="pancho-base"
                className={
                    "absolute inset-0 w-full h-full object-cover" +
                    (dog.status === "DEAD" ? " grayscale" : "")
                }
                style={{ zIndex: 1 }}
                src={dog.imgUrl || ""}
                alt={dog.name || "Pancho"}
            />

            {/* ---- Equipped cosmetic layers ---- */}
            {SLOT_ORDER.map((slot) => {
                const cosmeticId = equipped[slot];

                if (!cosmeticId) {
                    return null;
                }

<<<<<<< HEAD
                const cosmetic = COSMETIC_BY_ID[cosmeticId];

                if (!cosmetic || !cosmetic.image) {
                    return null;
                }

=======
>>>>>>> 913f93d391f63baac6fa9a41693b67de0185e060
                return (
                    <img
                        key={slot}
                        id={"pancho-layer-" + slot}
<<<<<<< HEAD
                        className={"absolute " + COSMETIC_LAYER_CLASS}
                        style={{ zIndex: SLOT_Z_INDEX[slot] }}
                        src={cosmetic.image}
                        alt={cosmetic.name}
=======
                        className={"absolute " + SLOT_POSITION_CLASSES[slot]}
                        style={{ zIndex: SLOT_Z_INDEX[slot] }}
                        src={PLACEHOLDER_BY_SLOT[slot]}
                        alt={slot + " equipped"}
>>>>>>> 913f93d391f63baac6fa9a41693b67de0185e060
                    />
                );
            })}

            {/* ---- DEAD overlay badge ---- */}
            {dog.status === "DEAD" && (
                <div
                    id="pancho-dead-badge"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-xl text-center px-2"
                    style={{ zIndex: 20 }}
                >
                    Pancho didn't make it 💔
                </div>
            )}
        </>
    );
}
