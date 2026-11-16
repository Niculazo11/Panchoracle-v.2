// Minigame routes (UN-303), mounted in app.js under /api/minigames. Students only.
// This is a simple reward endpoint; UN-501 will add full quiz grading.
import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validateBody.js";
import { z } from "zod";
import * as service from "../services/gameService.js";

const router = Router();
router.use(authorize("student"));

const rewardSchema = z.strictObject({
  correctCount: z.number().int().min(1, "correctCount must be at least 1"),
});

// POST /api/minigames/reward -> 200 { student, dog, currentAssignment }
router.post("/reward", validateBody(rewardSchema), async (req, res) => {
  res.status(200).json(await service.awardMinigameCoins(req.user, req.body.correctCount));
});

export default router;