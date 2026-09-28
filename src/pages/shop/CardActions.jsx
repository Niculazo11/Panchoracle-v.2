export default function CardActions({ item, student, owned, equipped, slot, onBuy, onEquip, onUnequip }) {
    return (
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
    );
}
