import { asset } from "../../lib/asset.js";

// The picture already includes the bowl, so it is drawn once (a second copy of the same
// picture used to be added next to it, which looked like two dogs).
const DOG = "images/homework-dog.png";

// The dog and its bowl stay at the bottom-right corner of the screen while the
// list scrolls (position: fixed). It ignores clicks so it never covers a link.
export default function HomeworkDog() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed bottom-0 right-2 sm:right-6 z-0 w-60 sm:w-80">
            <img src={asset(DOG)} alt="" className="block w-full object-contain" />
        </div>
    );
}
