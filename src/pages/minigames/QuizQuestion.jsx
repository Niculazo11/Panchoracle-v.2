import QuizOption from "./QuizOption.jsx";

// Current question: the prompt, its 4 options, and a "Next" button that
// only appears once the player has picked an answer.
export default function QuizQuestion({ quiz }) {
    const { current, questionNumber, totalQuestions, selected, selectAnswer, goToNext, isLastQuestion } = quiz;

    return (
        <div className="flex max-w-md flex-col gap-4 rounded-2xl bg-white/90 p-6 shadow-xl">
            <p className="text-sm font-semibold text-black/60">
                Question {questionNumber} of {totalQuestions}
            </p>

            <h3 className="text-xl font-bold text-black">{current.prompt}</h3>

            <div className="flex flex-col gap-3">
                {current.options.map((option, optionIndex) => (
                    <QuizOption
                        key={option}
                        text={option}
                        isCorrect={optionIndex === current.correctIndex}
                        isSelected={selected === optionIndex}
                        answered={selected !== null}
                        onClick={() => selectAnswer(optionIndex)}
                    />
                ))}
            </div>

            {selected !== null && (
                <button
                    type="button"
                    onClick={goToNext}
                    className="w-fit self-end rounded-full bg-black px-6 py-2 font-semibold text-white transition hover:bg-neutral-800"
                >
                    {isLastQuestion ? "See results" : "Next question"}
                </button>
            )}
        </div>
    );
}
