import {
    PLACEHOLDER_BY_SLOT,
    SLOT_Z_INDEX,
    SLOT_POSITION_CLASSES,
    SLOT_ORDER
} from "../lib/panchoRender.js";

// Paints Pancho's base image + the layers for any equipped cosmetics
// inside #pancho-container (position: relative). This is the JSX
// equivalent of the original renderPanchoLayers(container, dog)
// function from js/panchoRender.js — same layers, same z-index, same
// placeholder assets, same "DEAD" grayscale/overlay treatment.
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

                return (
                    <img
                        key={slot}
                        id={"pancho-layer-" + slot}
                        className={"absolute " + SLOT_POSITION_CLASSES[slot]}
                        style={{ zIndex: SLOT_Z_INDEX[slot] }}
                        src={PLACEHOLDER_BY_SLOT[slot]}
                        alt={slot + " equipped"}
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
