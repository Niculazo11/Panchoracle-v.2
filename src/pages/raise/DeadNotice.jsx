import { DEAD_STATUS_MESSAGE } from "../../state/gameState.js";

// Same paragraph as before: always rendered, hidden with the original
// Tailwind "hidden" class while Pancho is alive.
export default function DeadNotice({ dog, className }) {
    return (
        <p id="deadNotice" className={className + (dog.status !== "DEAD" ? " hidden" : "")}>
            {DEAD_STATUS_MESSAGE}
        </p>
    );
}
