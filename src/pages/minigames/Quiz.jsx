import { useQuiz } from "./useQuiz.js";
import QuizQuestion from "./QuizQuestion.jsx";
import QuizResult from "./QuizResult.jsx";

// Wires useQuiz's state machine to the two screens (question / result)
// and reports the final score up to MiniGames.jsx, which owns the
// GameState coin award — this component only knows about quiz state.
export default function Quiz({ onComplete }) {
    const quiz = useQuiz({ onComplete });

    if (quiz.loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6B5A8E] border-t-transparent" />
            </div>
        );
    }

    if (quiz.finished) {
        return (
            <QuizResult
                correctCount={quiz.correctCount}
                totalQuestions={quiz.totalQuestions}
                onPlayAgain={quiz.playAgain}
            />
        );
    }

    return <QuizQuestion quiz={quiz} />;
}
