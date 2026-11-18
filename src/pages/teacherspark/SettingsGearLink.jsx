import { Link } from "react-router-dom";
import { asset } from "../../lib/asset.js";
import { SETTINGS_PATH } from "./teacherPaths.js";

// Gear button at the bottom left of the park. It opens the classroom settings page.
// The picture is public/images/settings-gear.png: replace that file to change the icon.
export default function SettingsGearLink() {
    return (
        <Link
            to={SETTINGS_PATH}
            aria-label="Classroom settings"
            title="Classroom settings"
            className="absolute left-4 bottom-4 z-10 block w-14 h-14 rounded-full hover:scale-110 transition-transform focus-visible:outline-4 focus-visible:outline-white"
        >
            <img src={asset("images/settings-gear.png")} alt="" className="w-full h-full object-contain" />
        </Link>
    );
}
