import { useGameState } from "../../state/GameStateContext.jsx";
import { CATEGORY_TO_SLOT } from "../../lib/panchoRender.js";
import FavoriteButton from "./FavoriteButton.jsx";
import CardActions from "./CardActions.jsx";

// Info card of /Shop/:cosmeticId: image, name, category, price,
// favourite star and the buy / equip / unequip buttons (with their
// handlers). `showFeedback` writes to the message under Pancho.
export default function CosmeticInfo({ item, isFavorite, onToggleFavorite, showFeedback }) {
    const { dog, student, buyCosmetic, equipCosmetic } = useGameState();

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
                <FavoriteButton active={isFavorite} onToggle={onToggleFavorite} name={item.name} />
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
    );
}
