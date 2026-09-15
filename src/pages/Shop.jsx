import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { CATEGORY_TO_SLOT } from "../lib/panchoRender.js";
import PanchoLayers from "../components/PanchoLayers.jsx";
import catalog from "../data/dataset.json";

const FEEDBACK_TIMEOUT_MS = 2500;

function formatCoins(n) {
    return n.toLocaleString("en-US");
}

function CosmeticCard({ item, student, dog, onBuy, onEquip, onUnequip }) {
    const slot = CATEGORY_TO_SLOT[item.category];
    const owned = student.inventory.includes(item.id);
    const equipped = slot && dog.equippedCosmetics[slot] === item.id;

    return (
        <article className={"flex flex-col gap-2 rounded-xl border border-black/10 bg-white/90 p-4 shadow " + (equipped ? "ring-4 ring-yellow-400" : "")}>
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                </div>
                <p className="font-bold whitespace-nowrap">${item.cost}</p>
            </div>

            <div className="flex gap-2 mt-1">
                {!owned && (
                    <button
                        type="button"
                        disabled={student.coins < item.cost}
                        onClick={() => onBuy(item)}
                        className="flex-1 rounded-lg bg-[#6B5A8E] text-white font-semibold py-1.5 text-sm shadow hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {student.coins < item.cost ? "Not enough coins" : "Buy"}
                    </button>
                )}

                {owned && equipped && (
                    <button
                        type="button"
                        onClick={() => onUnequip(item, slot)}
                        className="flex-1 rounded-lg bg-gray-700 text-white font-semibold py-1.5 text-sm shadow hover:opacity-90 transition"
                    >
                        Unequip
                    </button>
                )}

                {owned && !equipped && (
                    <button
                        type="button"
                        onClick={() => onEquip(item, slot)}
                        className="flex-1 rounded-lg bg-emerald-600 text-white font-semibold py-1.5 text-sm shadow hover:opacity-90 transition"
                    >
                        Equip
                    </button>
                )}
            </div>
        </article>
    );
}

export default function Shop() {
    const navigate = useNavigate();
    const { dog, student, buyCosmetic, equipCosmetic } = useGameState();

    const [feedback, setFeedback] = useState("");
    const feedbackTimeoutRef = useRef(null);

    function showFeedback(message) {
        if (!message) {
            return;
        }
        setFeedback(message);
        window.clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(""), FEEDBACK_TIMEOUT_MS);
    }

    // No point shopping for cosmetics before a Pancho has been chosen.
    useEffect(() => {
        if (!dog.imgUrl) {
            navigate("/choosePancho.html");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dog.imgUrl]);

    if (!dog.imgUrl) {
        return null;
    }

    function handleBuy(item) {
        const result = buyCosmetic(item);
        showFeedback(result.message);
    }

    function handleEquip(item, slot) {
        const result = equipCosmetic(item.id, slot);
        if (!result.success) {
            showFeedback(result.message);
        }
    }

    function handleUnequip(item, slot) {
        equipCosmetic(null, slot);
        showFeedback(`You unequipped "${item.name}" from Pancho.`);
    }

    return (
        <div className="min-h-screen bg-[#c69f85] flex flex-col items-center pb-16">

            <header className="w-full flex items-center justify-between px-5 py-4">
                <h1 className="text-3xl font-bold text-black">Shop</h1>

                <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 font-bold">
                    <img src="/images/paw.png" alt="Coins" className="w-5 h-5" />
                    <span>Your balance:</span>
                    <span id="balanceLabel">{formatCoins(student.coins)}</span>
                </div>
            </header>

            <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 px-5">

                {/* ====== Live preview of the equipped Pancho ====== */}
                <section className="flex flex-col items-center gap-3 lg:w-72 shrink-0">

                    <div id="pancho-container" className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-white/40 shadow-xl border-4 border-white/60 overflow-hidden">
                        <PanchoLayers dog={dog} />
                    </div>

                    <p id="shopFeedback" className="min-h-[1.25rem] text-sm font-semibold text-black text-center">{feedback}</p>

                    <a href="/raisePancho.html"
                       className="mt-2 px-5 py-2 rounded-full bg-[#6B5A8E] text-white font-semibold shadow hover:opacity-90 transition">
                        come back
                    </a>
                </section>

                {/* ====== Cosmetics catalog ====== */}
                <section className="flex-1">
                    <div id="cosmeticsGrid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {catalog.map((item) => (
                            <CosmeticCard
                                key={item.id}
                                item={item}
                                student={student}
                                dog={dog}
                                onBuy={handleBuy}
                                onEquip={handleEquip}
                                onUnequip={handleUnequip}
                            />
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}
