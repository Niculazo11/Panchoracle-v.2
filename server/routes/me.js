import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { toUserJson } from "../utils/userJson.js";
import { getGameState } from "../services/gameService.js";
import { listMySubmissions, toSubmissionJson } from "../services/submissionService.js";

const router = Router();
router.get("/", (req, res) => res.json({ user: toUserJson(req.user) }));

// GET /api/me/game -> { student, dog, currentAssignment } (UN-301). Students only.
router.get("/game", authorize("student"), async (req, res) => {
  res.status(200).json(await getGameState(req.user));
});

// GET /api/me/submissions -> { submissions } what the student handed in (docs/submissions-api.md).
router.get("/submissions", authorize("student"), async (req, res) => {
  const submissions = await listMySubmissions(req.user);
  res.status(200).json({ submissions: submissions.map(toSubmissionJson) });
});

export default router;
