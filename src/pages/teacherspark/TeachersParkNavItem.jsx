import { Link } from "react-router-dom";
import { asset } from "../../lib/asset.js";

// One icon + two-line label of the top bar.
export default function TeachersParkNavItem({ item }) {
    return (
        <Link
            to={item.to}
            className="flex flex-col items-center gap-1 text-black font-serif text-sm sm:text-base leading-tight text-center no-underline"
        >
            {/* The icon image goes here (see navItems.js for the file of each option). */}
            <img src={asset(item.icon)} alt="" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
            <span>
                {item.label[0]}
                <br />
                {item.label[1]}
            </span>
        </Link>
    );
}