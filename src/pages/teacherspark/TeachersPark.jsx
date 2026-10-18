import { asset } from "../../lib/asset.js";
import TeachersParkNav from "./TeachersParkNav.jsx";
import ParkDog from "./ParkDog.jsx";
import { PARK_DOGS } from "./parkDogs.js";

// Teacher's view: the park where all the students' dogs wander.
// Visual only for now: the nav tabs and the dogs are not wired to any data.
export default function TeachersPark() {
    return (
        <div className="min-h-screen flex flex-col bg-[#c9d8a4]">
            <TeachersParkNav />

            <main
                className="relative flex-1 min-h-[420px] overflow-hidden bg-cover bg-center bg-no-repeat"
                // TODO(IMAGE): PARK BACKGROUND (watercolor park with trees, path, bench and
                // dog house). Save it as public/images/teachers-park-bg.png
                // (or change the file name here).
                style={{ backgroundImage: `url("${asset("images/teachers-park-bg.png")}")` }}
            >
                {PARK_DOGS.map((dog) => (
                    <ParkDog key={dog.id} dog={dog} />
                ))}
            </main>
        </div>
    );
}