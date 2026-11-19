import PanchoLayers from "../../components/PanchoLayers.jsx";
import { asset } from "../../lib/asset.js";
import { PLACEHOLDER_DOG } from "./parkDogs.js";

// The student's Pancho with the cosmetics they equipped, small enough for a card.
// Same idea as the park dog: PanchoLayers always gets "ALIVE" (its dead banner is too big
// here), and a dead Pancho is drawn gray instead.
export default function StudentAvatar({ student, dead }) {
    const pancho = student.pancho;
    const picture = {
        name: pancho && pancho.name ? pancho.name : "Pancho",
        imgUrl: pancho && pancho.imgUrl ? pancho.imgUrl : asset(PLACEHOLDER_DOG),
        equippedCosmetics: pancho ? pancho.equipped : {},
        status: "ALIVE"
    };

    return (
        <div className={"relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-4 " + (dead ? "grayscale opacity-70 border-gray-500" : "border-white")}>
            <PanchoLayers dog={picture} />
        </div>
    );
}
