import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameState } from "../state/GameStateContext.jsx";
import { useFeedback } from "../lib/useFeedback.js";
import { useFavorites } from "../lib/useFavorites.js";
import catalog from "../data/dataset.json";
import ShopHeader from "./shop/ShopHeader.jsx";
import ShopPreview from "./shop/ShopPreview.jsx";
import CosmeticCard from "./shop/CosmeticCard.jsx";

const FEEDBACK_TIMEOUT_MS = 2500;

export default function Shop() {
    const navigate = useNavigate();
    const { dog, student, buyCosmetic, equipCosmetic } = useGameState();
    const { feedback, showFeedback } = useFeedback(FEEDBACK_TIMEOUT_MS);
    const { isFavorite, toggleFavorite } = useFavorites(student.id);

    // No point shopping for cosmetics before a Pancho has been chosen.
    useEffect(() => {
        if (!dog.imgUrl) {
            navigate("/choosePancho.html");
        }
    }, [dog.imgUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!dog.imgUrl) {
        return null;
    }

    function handleBuy(item) {
        showFeedback(buyCosmetic(item).message);
    }

    function handleEquip(item, slot) {
        const result = equipCosmetic(item.id, slot);
        if (!result.success) showFeedback(result.message);
    }

    function handleUnequip(item, slot) {
        equipCosmetic(null, slot);
        showFeedback(`You unequipped "${item.name}" from Pancho.`);
    }

    return (
        <div className="min-h-screen bg-[#c69f85] flex flex-col items-center pb-16">

            <ShopHeader student={student} />

            <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 sm:gap-8 px-4 sm:px-6">

                {/* ====== Live preview of the equipped Pancho ====== */}
                <ShopPreview dog={dog} feedback={feedback} />

                {/* ====== Cosmetics catalog ====== */}
                <section className="flex-1">
                    <div id="cosmeticsGrid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {catalog.map((item) => (
                            <CosmeticCard
                                key={item.id}
                                item={item}
                                student={student}
                                dog={dog}
                                favorite={isFavorite(item.id)}
                                onToggleFavorite={toggleFavorite}
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
