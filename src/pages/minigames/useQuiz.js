import { useState } from "react";

// Drives one quiz round: current question, the player's pending answer,
// a running count of correct answers and whether the round is over.
// No timers/subscriptions here, so there's nothing to clean up — state
// transitions only ever happen in response to the player's own clicks.
export function useQuiz(questions) {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);

    const current = questions[index];
    const isLastQuestion = index === questions.length - 1;

    function selectAnswer(optionIndex) {
        if (selected !== null) {
            return; // already answered this question, ignore further clicks
        }

        setSelected(optionIndex);
        if (optionIndex === current.correctIndex) {
            setCorrectCount((count) => count + 1);
        }
    }

    function goToNext() {
        if (isLastQuestion) {
            setFinished(true);
            return;
        }

        setIndex((i) => i + 1);
        setSelected(null);
    }

    function playAgain() {
        setIndex(0);
        setSelected(null);
        setCorrectCount(0);
        setFinished(false);
    }

    return {
        current,
        questionNumber: index + 1,
        totalQuestions: questions.length,
        selected,
        correctCount,
        finished,
        isLastQuestion,
        selectAnswer,
        goToNext,
        playAgain
    };
}
