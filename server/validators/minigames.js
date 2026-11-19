// Validation for the quiz minigame endpoints (UN-501, ADR 8.6 / 8.8).
import { z } from "zod";

// GET /api/minigames/quiz -> no body, but strict schema for query params if needed later.
// Currently no query params accepted; strictObject({}) rejects unknown keys.

// POST /api/minigames/quiz/submit
// Body: { answers: [{ questionId: "q1", selectedIndex: 0 }, ...] }
// Only 5 questions per round; each selectedIndex must be a valid integer within options range.
const answerSchema = z
  .strictObject({
    questionId: z.string().trim().min(1, "questionId is required"),
    selectedIndex: z.number().int().min(0, "selectedIndex must be >= 0"),
  })
  .describe("A single answer to a quiz question");

export const submitQuizSchema = z.strictObject({
  answers: z
    .array(answerSchema)
    .length(5, "Exactly 5 answers are required (one per question)")
    .refine(
      (arr) => new Set(arr.map((a) => a.questionId)).size === 5,
      "Duplicate questionId in answers"
    ),
});

// Query params for future filtering (not used yet, but schema ready)
export const quizQuerySchema = z.strictObject({});

// POST /api/classrooms/:id/minigames/assign
// Body: { minigameId: "quiz" }
const minigameIdSchema = z
  .string({ error: "minigameId must be a string" })
  .trim()
  .min(1, "minigameId is required")
  .max(50, "minigameId is too long")
  .describe("Minigame identifier (e.g., 'quiz')");

export const assignMinigameSchema = z.strictObject({
  minigameId: minigameIdSchema,
});

// Path params for assignment removal
export const minigameAssignmentParamsSchema = z.strictObject({
  id: z.string().min(1),      // classroomId
  assignmentId: z.string().min(1), // minigameAssignment._id
});