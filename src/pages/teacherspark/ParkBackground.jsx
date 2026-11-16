import { asset } from "../../lib/asset.js";

// The watercolor park. Used by the park page and by the loading and error states.
export default function ParkBackground({ children }) {
    return (
        <main
            className="relative flex-1 min-h-[420px] overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${asset("images/teachers-park-bg.jpeg")}")` }}
        >
            {children}
        </main>
    );
}
