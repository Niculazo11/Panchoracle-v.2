import PanchoLayers from "../../components/PanchoLayers.jsx";
import { asset } from "../../lib/asset.js";
import { PLACEHOLDER_DOG } from "./parkDogs.js";

// One student's Pancho in the park: the name on top and the dog with the cosmetics the
// student equipped. A dead Pancho is grey and carries a broken heart, so it stands out.
export default function ParkDog({ dog }) {
    const { student, x, y } = dog;
    const pancho = student.pancho;
    const isDead = Boolean(student.pet) && student.pet.status === "dead";

    // The grey look is added here, so PanchoLayers always gets "ALIVE": its own
    // dead banner is too big for a small park dog.
    const picture = {
        name: pancho && pancho.name ? pancho.name : "Pancho",
        imgUrl: pancho && pancho.imgUrl ? pancho.imgUrl : asset(PLACEHOLDER_DOG),
        equippedCosmetics: pancho ? pancho.equipped : {},
        status: "ALIVE"
    };

    return (
        <div className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
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
