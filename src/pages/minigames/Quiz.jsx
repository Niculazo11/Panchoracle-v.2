import { useState } from "react";
import { QUIZ_QUESTIONS } from "./quizQuestions.js";
import { useQuiz } from "./useQuiz.js";
import QuizQuestion from "./QuizQuestion.jsx";
import QuizResult from "./QuizResult.jsx";

// Wires useQuiz's state machine to the two screens (question / result)
// and reports the final score up to MiniGames.jsx, which owns the
// GameState coin award — this component only knows about quiz state.
export default function Quiz({ onComplete }) {
    const quiz = useQuiz(QUIZ_QUESTIONS);
    const [claimed, setClaimed] = useState(false);

    function handleClaim() {
        onComplete(quiz.correctCount);
        setClaimed(true);
    }

    function handlePlayAgain() {
        quiz.playAgain();
        setClaimed(false);
    }

    if (quiz.finished) {
        return (
            <QuizResult
                correctCount={quiz.correctCount}
                totalQuestions={quiz.totalQuestions}
                onClaim={handleClaim}
                onPlayAgain={handlePlayAgain}
                claimed={claimed}
            />
        );
    }

    return <QuizQuestion quiz={quiz} />;
}
