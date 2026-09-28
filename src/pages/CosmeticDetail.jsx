import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { useFeedback } from "../lib/useFeedback.js";
import { useFavorites } from "../lib/useFavorites.js";
import catalog from "../data/dataset.json";
import { CATEGORY_TO_SLOT } from "../lib/panchoRender.js";
import PanchoLayers from "../components/PanchoLayers.jsx";
import FavoriteButton from "./shop/FavoriteButton.jsx";
import CardActions from "./shop/CardActions.jsx";

const FEEDBACK_TIMEOUT_MS = 2500;

// Detail route: /Shop/:cosmeticId. Mirrors the pattern already used by
// PanchoStats (/stats/:username) — the id in the URL is looked up
// against the same catalog Shop.jsx renders from, so this page is a
// shareable, per-item deep link into the shop rather than a new data
// source.
export default function CosmeticDetail() {
    const navigate = useNavigate();
    const { cosmeticId } = useParams();
    const { dog, student, buyCosmetic, equipCosmetic } = useGameState();
    const { feedback, showFeedback } = useFeedback(FEEDBACK_TIMEOUT_MS);
    const { isFavorite, toggleFavorite } = useFavorites(student.id);

    // No point looking at cosmetics before a Pancho has been chosen.
    useEffect(() => {
        if (!dog.imgUrl) {
            navigate("/choosePancho.html");
        }
    }, [dog.imgUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!dog.imgUrl) {
        return null;
    }

    const item = catalog.find((cosmetic) => String(cosmetic.id) === cosmeticId);

    // Unknown/stale id in the URL -> back to the full shop instead of
    // rendering an empty page.
    if (!item) {
        return (
            <div className="min-h-screen bg-[#c69f85] flex flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-lg font-semibold text-black">
                    That item doesn't exist.
                </p>
                <Link
                    to="/shop"
                    className="px-5 py-2 rounded-full bg-[#6B5A8E] text-white font-semibold shadow hover:opacity-90 transition"
                >
                    Back to shop
                </Link>
            </div>
        );
    }

    const slot = CATEGORY_TO_SLOT[item.category];
    const owned = student.inventory.includes(item.id);
    const equipped = slot && dog.equippedCosmetics[slot] === item.id;

    function handleBuy() {
        showFeedback(buyCosmetic(item).message);
    }

    function handleEquip() {
        const result = equipCosmetic(item.id, slot);
        if (!result.success) showFeedback(result.message);
    }

    function handleUnequip() {
        equipCosmetic(null, slot);
        showFeedback(`You unequipped "${item.name}" from Pancho.`);
    }

    return (
        <div className="min-h-screen bg-[#c69f85] flex flex-col items-center pb-16">

            <header className="w-full flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4">
                <Link to="/shop" className="text-black font-semibold hover:underline">
                    ← Back to shop
                </Link>
            </header>

            <main className="w-full max-w-3xl flex flex-col sm:flex-row gap-6 sm:gap-8 px-4 sm:px-6">

                <section className="w-full flex flex-col items-center gap-3 sm:w-72 sm:shrink-0">
                    <div className="relative w-44 h-44 sm:w-64 sm:h-64 rounded-2xl bg-white/40 shadow-xl border-4 border-white/60 overflow-hidden">
                        <PanchoLayers dog={dog} />
                    </div>
                    <p className="min-h-[1.25rem] text-sm font-semibold text-black text-center">{feedback}</p>
                </section>

                <section className="flex-1 flex flex-col gap-4 rounded-xl border border-black/10 bg-white/90 p-4 sm:p-6 shadow">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4">
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-20 h-20 rounded-lg bg-black/5 object-contain shrink-0"
                                />
                            )}
                            <div>
                                <h1 className="text-2xl font-bold">{item.name}</h1>
                                <p className="text-sm text-gray-500">{item.category}</p>
                            </div>
                        </div>
                        <FavoriteButton active={isFavorite(item.id)} onToggle={() => toggleFavorite(item.id)} name={item.name} />
                    </div>

                    <p className="text-xl font-bold">${item.cost}</p>

                    <CardActions
                        item={item}
                        student={student}
                        owned={owned}
                        equipped={equipped}
                        slot={slot}
                        onBuy={handleBuy}
                        onEquip={handleEquip}
                        onUnequip={handleUnequip}
                    />
                </section>

            </main>
        </div>
    );
}
