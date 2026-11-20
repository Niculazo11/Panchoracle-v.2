// One answer button. Shows selected state. Correct/incorrect feedback
// is shown in results (server-side grading per UN-501).
export default function QuizOption({ text, isSelected, answered, onClick }) {
    let colorClasses = "bg-white dark:bg-[#14200f] hover:bg-gray-100 dark:hover:bg-[#1a3d1a] text-black dark:text-white border-black/20 dark:border-white/20";

    if (answered && isSelected) {
        colorClasses = "bg-[#6B5A8E]/20 border-[#6B5A8E] text-[#6B5A8E] dark:bg-[#a78bfa]/30 dark:border-[#a78bfa] dark:text-[#a78bfa]";
    } else if (answered) {
        colorClasses = "bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400";
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
