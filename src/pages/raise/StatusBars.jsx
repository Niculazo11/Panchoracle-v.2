import { useChangeFlash } from "../../lib/useChangeFlash.js";

export default function StatusBars({ dog }) {
    const hungerChanged = useChangeFlash(dog.hunger);
    const healthChanged = useChangeFlash(dog.health);

    return (
        <>
            <div>
                <div className="flex justify-between mb-1 text-sm font-bold">
                    <span>Hunger</span>
                    <span id="hungerLabel" className={hungerChanged ? "animate-stat-pulse" : undefined}>{dog.hunger} / 100</span>
                </div>
                <div className="h-5 w-full rounded-full border border-black/20 bg-[#eee] overflow-hidden">
                    <div id="hungerBar" className="h-full bg-amber-500 transition-all duration-300" style={{ width: dog.hunger + "%" }}></div>
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-1 text-sm font-bold">
                    <span>Health</span>
                    <span id="healthLabel" className={healthChanged ? "animate-stat-pulse" : undefined}>{dog.health} / 100</span>
                </div>
                <div className="h-5 w-full rounded-full border border-black/20 bg-[#eee] overflow-hidden">
                    <div id="healthBar" className={"h-full transition-all duration-300 " + (dog.health <= 25 ? "bg-red-600" : "bg-emerald-500")} style={{ width: dog.health + "%" }}></div>
                </div>
            </div>
        </>
    );
}
