// GET /api/cosmetics (UN-301): the cosmetics catalog from MongoDB, for any logged-in user.
import { Router } from "express";
import { listCosmetics } from "../services/gameService.js";

const router = Router();

router.get("/", async (req, res) => {
  res.status(200).json({ cosmetics: await listCosmetics() });
});

export default router;
