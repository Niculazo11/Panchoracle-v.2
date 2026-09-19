import { Link } from "react-router-dom";

export default function RaiseNav() {
    return (
        <nav className="relative flex items-center h-[110px] w-full bg-[oklch(90.1%_0.076_70.697)]">

            <h1 className="absolute left-2 bottom-4 text-4xl sm:text-6xl font-bold tracking-wide text-black">
                Raise a pancho
            </h1>

            <Link to="/MiniGames.html" className="absolute right-3 top-1 flex flex-col items-center gap-1 text-black font-serif text-base">
                <img src="/images/PlayingBall.png" alt="MiniGames" className="w-16 h-16 object-contain" />
                <span>MiniGames</span>
            </Link>

            <Link to="/panchoStats.html" className="absolute right-28 top-1 flex flex-col items-center gap-1 text-black font-serif text-base">
                <img src="/images/PlayingCards.png" alt="Stats" className="w-16 h-16 object-contain" />
                <span>Stats</span>
            </Link>

        </nav>
    );
}
