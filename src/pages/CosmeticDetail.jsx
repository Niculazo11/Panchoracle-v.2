import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { useFeedback } from "../lib/useFeedback.js";
import { useFavorites } from "../lib/useFavorites.js";
import catalog from "../data/catalog.js";
import CosmeticInfo from "./shop/CosmeticInfo.jsx";
import CosmeticPreview from "./shop/CosmeticPreview.jsx";
import CosmeticNotFound from "./shop/CosmeticNotFound.jsx";

const FEEDBACK_TIMEOUT_MS = 2500;

// Detail route: /Shop/:cosmeticId. Mirrors the pattern already used by
// PanchoStats (/stats/:username) — the id in the URL is looked up
// against the same catalog Shop.jsx renders from, so this page is a
// shareable, per-item deep link into the shop rather than a new data
// source.
export default function CosmeticDetail() {
    const navigate = useNavigate();
    const { cosmeticId } = useParams();
    const { dog, student } = useGameState();
    const { feedback, showFeedback } = useFeedback(FEEDBACK_TIMEOUT_MS);
    const { isFavorite, toggleFavorite } = useFavorites(student.id);

    // No point looking at cosmetics before a Pancho has been chosen.
    useEffect(() => {
        if (!dog.imgUrl) {
            navigate("/choosePancho.html");
        }
    }, [dog.imgUrl, navigate]);

    if (!dog.imgUrl) {
        return null;
    }

    const item = catalog.find((cosmetic) => String(cosmetic.id) === cosmeticId);

    // Unknown/stale id in the URL -> back to the full shop instead of
    // rendering an empty page.
    if (!item) {
        return <CosmeticNotFound />;
    }

    return (
        <div className="min-h-screen bg-[#c69f85] flex flex-col items-center pb-16">

            <header className="w-full flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4">
                <Link to="/shop" className="text-black font-semibold hover:underline">
                    ← Back to shop
                </Link>
            </header>

            <main className="w-full max-w-3xl flex flex-col sm:flex-row gap-6 sm:gap-8 px-4 sm:px-6">

                <CosmeticPreview dog={dog} feedback={feedback} />

                <CosmeticInfo
                    item={item}
                    isFavorite={isFavorite(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    showFeedback={showFeedback}
                />

            </main>
        </div>
    );
}
