import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { toUserJson } from "../utils/userJson.js";
import { getGameState } from "../services/gameService.js";

const router = Router();
router.get("/", (req, res) => res.json({ user: toUserJson(req.user) }));

// GET /api/me/game -> { student, dog, currentAssignment } (UN-301). Students only.
router.get("/game", authorize("student"), async (req, res) => {
  res.status(200).json(await getGameState(req.user));
});

export default router;
