// Minigame routes (UN-501), mounted in app.js under /api/minigames. Students only.
// Replaces UN-303 stop-gap /reward endpoint with full quiz grading on the server.
import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validateBody.js";
import { submitQuizSchema, quizQuerySchema } from "../validators/minigames.js";
import { getQuizQuestions, submitQuiz } from "../services/minigameService.js";

const router = Router();
router.use(authorize("student"));

// GET /api/minigames/quiz -> 200 { questions: [{ id, prompt, options }, ...] }
// Devuelve las 5 preguntas SIN correctIndex (el servidor califica).
router.get("/quiz", validateQuery(quizQuerySchema), async (req, res) => {
  res.status(200).json(await getQuizQuestions());
});

// POST /api/minigames/quiz/submit -> 200 { reward, correctCount, gameState, ... }
// Recibe las 5 respuestas, califica en el servidor, aplica recompensa y límites.
router.post("/quiz/submit", validateBody(submitQuizSchema), async (req, res) => {
  const result = await submitQuiz(req.user, req.body.answers);
  res.status(200).json(result);
});

export default router;