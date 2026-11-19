import PanchoLayers from "../../components/PanchoLayers.jsx";
import { asset } from "../../lib/asset.js";
import { PLACEHOLDER_DOG } from "./parkDogs.js";
import { useWanderingDog } from "./useWanderingDog.js";

// Position of the dog. The transition makes it glide to the spot instead of jumping, and
// dogs lower in the park are drawn in front (always below the gear button, which is z-10).
function walkStyle(spot) {
    return {
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        zIndex: Math.round(spot.y / 10),
        transition: spot.seconds > 0 ? `left ${spot.seconds}s linear, top ${spot.seconds}s linear` : "none"
    };
}

// One student's Pancho in the park: the name on top and the dog with the cosmetics the
// student equipped. The dog walks around the park by itself, except a dead Pancho: it stays
// still, grey and with a broken heart, so it stands out.
export default function ParkDog({ dog }) {
    const { student, x, y } = dog;
    const pancho = student.pancho;
    const isDead = Boolean(student.pet) && student.pet.status === "dead";
    const spot = useWanderingDog({ x, y }, !isDead);

    // The grey look is added here, so PanchoLayers always gets "ALIVE": its own
    // dead banner is too big for a small park dog.
    const picture = {
        name: pancho && pancho.name ? pancho.name : "Pancho",
        imgUrl: pancho && pancho.imgUrl ? pancho.imgUrl : asset(PLACEHOLDER_DOG),
        equippedCosmetics: pancho ? pancho.equipped : {},
        status: "ALIVE"
    };

    return (
        <div className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2" style={walkStyle(spot)}>
            <p className="m-0 mb-1 max-w-32 truncate px-2 py-0.5 rounded bg-white/85 text-black text-sm font-bold">{student.name}</p>

            <div className="relative">
                <div className={"relative w-20 h-20 sm:w-28 sm:h-28 rounded-lg overflow-hidden border-4 " + (isDead ? "grayscale opacity-70 border-gray-500" : "border-white")}>
                    <PanchoLayers dog={picture} />
                </div>

                {isDead && (
                    <span role="img" aria-label="This Pancho did not make it" className="absolute -top-3 -right-3 text-3xl">💔</span>
                )}
            </div>
        </div>
    );
}
