export default function MiniGames() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#a3a960]">
            {/* ============================================================
                BACKGROUND IMAGE GOES HERE
                Replace the src below with your actual background image
                (the park scene with grass, trees, bench and the dog/person
                illustration). The image should cover the full section;
                object-cover + inset-0 keeps it responsive.
               ============================================================ */}
            <img
                src="/images/fondo-minigame.jpeg"
                alt="Minigames background"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-bottom"
    />
            {/* If you'd rather use a CSS background instead of an <img>, delete
                the <img> above and add this to the outer div's className:
                bg-[url('/images/fondo-minigame.jpeg')] bg-cover bg-bottom
               ============================================================ */}

            {/* Content layer, sits above the background image */}
            <div className="relative z-10 flex min-h-screen flex-col justify-start gap-10 px-6 py-12 sm:px-12 sm:py-16">
                {/* Start a minigame pill */}
                <button
                    type="button"
                    className="w-fit rounded-full bg-[#d9d9c8]/90 px-10 py-6 text-2xl font-extrabold uppercase tracking-wide text-[#1a1a1a] shadow-md transition hover:bg-[#e5e5d6] sm:text-3xl"
                >
                    Start a Minigame
                </button>

                {/* Score submission block */}
                <div className="mt-8 flex max-w-md flex-col gap-6">
                    <h2 className="text-3xl font-extrabold leading-snug text-[#1a1a1a] sm:text-4xl">
                        Finished the minigame?
                        <br />
                        Submit your score!
                    </h2>

                    {/* Coins are earned EXCLUSIVELY here (Minigames), never from
                        academic assignments on raisePancho.html. Wire this button up
                        to GameState (a future GameState.awardMinigameCoins(amount)
                        method, or similar) once minigame scoring is implemented. */}
                    <button
                        type="button"
                        className="w-fit rounded-full bg-black px-8 py-4 text-lg font-semibold text-white transition hover:bg-neutral-800"
                    >
                        Submit File
                    </button>
                </div>
            </div>
        </div>
    );
}