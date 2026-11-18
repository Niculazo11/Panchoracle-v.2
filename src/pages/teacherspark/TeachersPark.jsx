import ParkBackground from "./ParkBackground.jsx";
import ParkDog from "./ParkDog.jsx";
import SettingsGearLink from "./SettingsGearLink.jsx";
import { PARK_DOGS } from "./parkDogs.js";

// The park, the main teacher view. TeacherShell draws the top bar around it and
// makes sure the teacher has a classroom. The dogs are still the fixed ones from
// parkDogs.js until the real students replace them.
export default function TeachersPark() {
    return (
        <ParkBackground>
            {PARK_DOGS.map((dog) => (
                <ParkDog key={dog.id} dog={dog} />
            ))}
            <SettingsGearLink />
        </ParkBackground>
    );
}
