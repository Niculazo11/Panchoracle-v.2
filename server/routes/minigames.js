// Minigame routes (UN-501), mounted in app.js under /api/minigames. Students only.
// Replaces UN-303 stop-gap /reward endpoint with full quiz grading on the server.
import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validateBody.js";
import { submitQuizSchema, quizQuerySchema } from "../validators/minigames.js";
import { getQuizQuestions, submitQuiz, getStudentAssignedMinigames } from "../services/minigameService.js";

const router = Router();
router.use(authorize("student"));

// GET /api/minigames/quiz -> 200 { questions: [{ id, prompt, options }, ...] }
// Returns 5 questions WITHOUT correctIndex (server grades).
router.get("/quiz", validateQuery(quizQuerySchema), async (req, res) => {
  res.status(200).json(await getQuizQuestions());
});

// POST /api/minigames/quiz/submit -> 200 { reward, correctCount, gameState, ... }
// Receives 5 answers, grades on server, applies reward and limits.
router.post("/quiz/submit", validateBody(submitQuizSchema), async (req, res) => {
  const result = await submitQuiz(req.user, req.body.answers);
  res.status(200).json(result);
});

// GET /api/minigames/assigned -> 200 { assignments: [...] }
// Lists minigames assigned to the student by their teacher.
router.get("/assigned", async (req, res) => {
  const assignments = await getStudentAssignedMinigames(req.user);
  res.status(200).json({ assignments });
});

export default router;