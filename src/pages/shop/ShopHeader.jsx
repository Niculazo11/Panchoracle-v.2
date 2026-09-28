import { formatCoins } from "../../lib/formatCoins.js";
import { useChangeFlash } from "../../lib/useChangeFlash.js";

export default function ShopHeader({ student }) {
    const coinsChanged = useChangeFlash(student.coins);

    return (
        <header className="w-full flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4">
            <h1 className="text-3xl font-bold text-black">Shop</h1>

            <div className={"flex items-center gap-2 rounded-full bg-white/80 px-3 sm:px-4 py-2 text-sm sm:text-base font-bold" + (coinsChanged ? " animate-coin-pop" : "")}>
                <img src="/images/paw.png" alt="Coins" className="w-5 h-5" />
                <span>Your balance:</span>
                <span id="balanceLabel">{formatCoins(student.coins)}</span>
            </div>
        </header>
    );
}
