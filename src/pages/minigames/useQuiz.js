import { useState, useCallback } from "react";
import { fetchQuizQuestions, submitQuiz } from "../../lib/gameApi.js";
import { useFeedback } from "../../lib/useFeedback.js";

// Drives one quiz round using UN-501 server-side grading.
// Fetches questions from server (no correctIndex), submits answers for grading.
export function useQuiz({ onComplete }) {
    const [questions, setQuestions] = useState([]);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { showError } = useFeedback();

    // Load questions on mount
    async function loadQuestions() {
        try {
            const data = await fetchQuizQuestions();
            // Server returns questions without correctIndex: { id, prompt, options }
            setQuestions(data);
        } catch (err) {
            showError(err.message || "Failed to load quiz");
        } finally {
            setLoading(false);
        }
    }

    // Initialize on first render
    if (questions.length === 0 && !loading) {
        loadQuestions();
    }

    const current = questions[index];
    const isLastQuestion = index === questions.length - 1;
    const totalQuestions = questions.length;

    function selectAnswer(optionIndex) {
        if (selected !== null || !current) return;
        setSelected(optionIndex);
    }

    async function goToNext() {
        if (!current || selected === null) return;

        // Store answer for this question
        const newAnswers = [...answers, { questionId: current.id, selectedIndex: selected }];
        setAnswers(newAnswers);

        if (isLastQuestion) {
            // Submit all answers to server for grading
            await submitAnswers(newAnswers);
        } else {
            setIndex((i) => i + 1);
            setSelected(null);
        }
    }

    async function submitAnswers(answerList) {
        setSubmitting(true);
        try {
            const result = await submitQuiz(answerList);
            // Server returns: { reward, correctCount, gameState, ... }
            setCorrectCount(result.correctCount);
            setFinished(true);
            if (onComplete) onComplete(result.correctCount);
        } catch (err) {
            showError(err.message || "Failed to submit quiz");
        } finally {
            setSubmitting(false);
        }
    }

    function playAgain() {
        setIndex(0);
        setSelected(null);
        setAnswers([]);
        setCorrectCount(0);
        setFinished(false);
        loadQuestions();
    }

    return {
        current,
        questionNumber: index + 1,
        totalQuestions,
        selected,
        correctCount,
        finished,
        isLastQuestion,
        loading,
        submitting,
        selectAnswer,
        goToNext,
        playAgain
    };
}
