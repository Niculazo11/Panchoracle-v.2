// Short academic trivia — the "quick quiz" style minigame promised in
// the About page FAQ ("find the pair" memory / quick quiz / match the
// concept). Kept intentionally small (5 questions) so a round is a
// 1-2 minute break, not a graded test.
export const QUIZ_QUESTIONS = [
    {
        id: "q1",
        prompt: "What is the result of 7 x 8?",
        options: ["54", "56", "64", "48"],
        correctIndex: 1
    },
    {
        id: "q2",
        prompt: "Which planet is known as the Red Planet?",
        options: ["Venus", "Jupiter", "Mars", "Saturn"],
        correctIndex: 2
    },
    {
        id: "q3",
        prompt: "What is the chemical symbol for water?",
        options: ["O2", "H2O", "CO2", "NaCl"],
        correctIndex: 1
    },
    {
        id: "q4",
        prompt: "Who wrote 'Don Quixote'?",
        options: ["Gabriel García Márquez", "Miguel de Cervantes", "Pablo Neruda", "Jorge Luis Borges"],
        correctIndex: 1
    },
    {
        id: "q5",
        prompt: "What is the capital of Colombia?",
        options: ["Medellín", "Cali", "Cartagena", "Bogotá"],
        correctIndex: 3
    }
];
