import { useCallback, useEffect, useState } from "react";
import { readFavorites, writeFavorites } from "./favorites.js";

// Favourites live in React state, and a useEffect mirrors that state
// into localStorage on every change (initial value is read back from
// localStorage, so the list survives a reload).
export function useFavorites(username) {
    const [favorites, setFavorites] = useState(() => readFavorites(username));

    useEffect(() => {
        writeFavorites(favorites, username);
    }, [favorites, username]);

    const isFavorite = useCallback(
        (id) => favorites.includes(id),
        [favorites]
    );

    const toggleFavorite = useCallback((id) => {
        setFavorites((current) =>
            current.includes(id)
                ? current.filter((favoriteId) => favoriteId !== id)
                : current.concat(id)
        );
    }, []);

    return { favorites, isFavorite, toggleFavorite };
}
