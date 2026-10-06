// One answer button. Once `selected` is set (the player has answered),
// the correct option turns green and a wrong pick turns red, so the
// feedback is visible without any extra state in the parent.
export default function QuizOption({ text, isCorrect, isSelected, answered, onClick }) {
    let colorClasses = "bg-white hover:bg-gray-100 text-black border-black/20";

    if (answered && isCorrect) {
        colorClasses = "bg-green-100 border-green-600 text-green-900";
    } else if (answered && isSelected && !isCorrect) {
        colorClasses = "bg-red-100 border-red-600 text-red-900";
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={answered}
            className={`w-full text-left rounded-lg border-2 px-4 py-3 font-semibold transition disabled:cursor-not-allowed ${colorClasses}`}
        >
            {text}
        </button>
    );
}
