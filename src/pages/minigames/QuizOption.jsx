// One answer button. Shows selected state. Correct/incorrect feedback
// is shown in results (server-side grading per UN-501).
export default function QuizOption({ text, isSelected, answered, onClick }) {
    let colorClasses = "bg-white hover:bg-gray-100 text-black border-black/20";

    if (answered && isSelected) {
        colorClasses = "bg-[#6B5A8E]/20 border-[#6B5A8E] text-[#6B5A8E]";
    } else if (answered) {
        colorClasses = "bg-gray-50 border-gray-300 text-gray-500";
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
