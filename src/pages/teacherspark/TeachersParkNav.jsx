import { asset } from "../../lib/asset.js";
import { NAV_ITEMS } from "./navItems.js";
import TeachersParkNavItem from "./TeachersParkNavItem.jsx";

// Tan top bar: title + paw on the left, the three teacher tabs on the right. yepos?
export default function TeachersParkNav() {
    return (
        <nav className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-3 bg-[#d3b48c] border-b-4 border-[#7c3aed]">
            <div className="flex items-center gap-3">
                <h1 className="m-0 text-3xl sm:text-5xl font-bold tracking-wide text-black">
                    Raise a Pancho
                </h1>
                {/* Black paw next to the title (existing asset, tinted black with brightness-0). */}
                <img src={asset("images/paw.png")} alt="" className="w-10 h-10 sm:w-14 sm:h-14 brightness-0" />
            </div>

            <ul className="flex items-start gap-4 sm:gap-8 m-0 p-0 list-none">
                {NAV_ITEMS.map((item) => (
                    <li key={item.id}>
                        <TeachersParkNavItem item={item} />
                    </li>
                ))}
            </ul>
        </nav>
    );
}