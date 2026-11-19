import { asset } from "../../lib/asset.js";

// TODO(IMAGE): add these two files to public/images/ (transparent PNG).
const DOG = "images/homework-dog.png";
const BOWL = "images/homework-bowl.png";

// The dog and its bowl stay at the bottom-right corner of the screen while the
// list scrolls (position: fixed). It ignores clicks so it never covers a link.
export default function HomeworkDog() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed bottom-0 right-2 sm:right-6 z-0 w-40 sm:w-56">
            <img src={asset(DOG)} alt="" className="block w-full object-contain" />
            <img src={asset(BOWL)} alt="" className="absolute bottom-0 -left-12 sm:-left-16 w-24 sm:w-32 object-contain" />
        </div>
    );
}
