// Star toggle added to each cosmetic card. The list of favourites is
// persisted in localStorage by useFavorites().
export default function FavoriteButton({ active, onToggle, name }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={active}
            title={active ? "Remove from favorites" : "Add to favorites"}
            aria-label={(active ? "Remove " : "Add ") + name + " to favorites"}
            className={"text-lg leading-none transition hover:scale-110 " + (active ? "text-yellow-500" : "text-gray-400")}
        >
            {active ? "★" : "☆"}
        </button>
    );
}
