// End-of-round summary. Coins are only granted when the player taps
// "Claim coins" — an explicit action, never awarded automatically just
// for the round ending, so there's no risk of double-awarding on a
// re-render.
export default function QuizResult({ correctCount, totalQuestions, onClaim, onPlayAgain, claimed }) {
    return (
        <div className="flex max-w-md flex-col items-start gap-4 rounded-2xl bg-white/90 p-6 shadow-xl">
            <h3 className="text-2xl font-extrabold text-black">Quiz complete!</h3>

            <p className="text-lg text-black">
                You got <span className="font-bold">{correctCount}</span> out of{" "}
                <span className="font-bold">{totalQuestions}</span> right.
            </p>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onClaim}
                    disabled={claimed || correctCount === 0}
                    className="rounded-full bg-black px-6 py-3 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {claimed ? "Coins claimed" : "Claim coins"}
                </button>

                <button
                    type="button"
                    onClick={onPlayAgain}
                    className="rounded-full border-2 border-black px-6 py-3 font-semibold text-black transition hover:bg-black/5"
                >
                    Play again
                </button>
            </div>
        </div>
    );
}
