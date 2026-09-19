import { CATEGORY_TO_SLOT } from "../../lib/panchoRender.js";
import CardActions from "./CardActions.jsx";
import FavoriteButton from "./FavoriteButton.jsx";

export default function CosmeticCard({ item, student, dog, favorite, onToggleFavorite, onBuy, onEquip, onUnequip }) {
    const slot = CATEGORY_TO_SLOT[item.category];
    const owned = student.inventory.includes(item.id);
    const equipped = slot && dog.equippedCosmetics[slot] === item.id;

    return (
        <article className={"flex flex-col gap-2 rounded-xl border border-black/10 bg-white/90 p-3 sm:p-4 shadow " + (equipped ? "ring-4 ring-yellow-400" : "")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                </div>
                <div className="flex items-center gap-2">
                    <FavoriteButton active={favorite} onToggle={() => onToggleFavorite(item.id)} name={item.name} />
                    <p className="font-bold whitespace-nowrap">${item.cost}</p>
                </div>
            </div>

            <CardActions
                item={item}
                student={student}
                owned={owned}
                equipped={equipped}
                slot={slot}
                onBuy={onBuy}
                onEquip={onEquip}
                onUnequip={onUnequip}
            />
        </article>
    );
}
