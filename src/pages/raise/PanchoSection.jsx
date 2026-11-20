import { Link } from "react-router-dom";
import PanchoLayers from "../../components/PanchoLayers.jsx";
import { formatCoins } from "../../lib/formatCoins.js";
import { useChangeFlash } from "../../lib/useChangeFlash.js";
import { asset } from "../../lib/asset.js";

export default function PanchoSection({ dog, student }) {
    const coinsChanged = useChangeFlash(student.coins);
    const hungerChanged = useChangeFlash(dog.hunger);

    return (
        <section className="flex flex-col items-center gap-4">

            <div className="flex items-center gap-3">
                <span id="panchoStateBadge" className={"px-3 py-1 rounded-full text-xs font-bold text-white " + (dog.status === "ALIVE" ? "bg-emerald-600 dark:bg-emerald-500" : "bg-red-700 dark:bg-red-600")}>{dog.status}</span>
                <span className={"flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/80 text-black dark:bg-black/70 dark:text-white" + (coinsChanged ? " animate-coin-pop" : "")}>
                    <img src={asset("images/paw.png")} alt="Coins" className="w-4 h-4 brightness-0 dark:brightness-100" />
                    <span id="coinsLabel">{formatCoins(student.coins)}</span>
                </span>
            </div>

            <div id="pancho-container" className={"relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-2xl bg-white/40 dark:bg-black/30 shadow-xl border-4 border-white/60 dark:border-white/20 overflow-hidden" + (hungerChanged ? " animate-bounce-short" : "")}>
                <PanchoLayers dog={dog} />
            </div>

            <Link to="/Shop.html" className="mt-2 px-5 py-2 rounded-full bg-[#6B5A8E] text-white dark:bg-[#a78bfa] dark:text-[#14200f] font-semibold shadow hover:opacity-90 transition">
                Go to Shop
            </Link>
        </section>
    );
}
