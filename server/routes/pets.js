// Pancho routes (UN-301), mounted in app.js under /api/pets. Students only (ADR 7.3):
// a teacher gets 403. Every route returns the whole game state { student, dog, currentAssignment }.
// Express 5 forwards errors thrown in async handlers to the error handler.
import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validateBody.js";
import { buyCosmeticSchema, equipSchema, choosePanchoSchema } from "../validators/game.js";
import * as service from "../services/gameService.js";

const router = Router();
router.use(authorize("student"));

// PUT /api/pets/me/pancho -> 200 (adopt / change the chosen dog)
router.put("/me/pancho", validateBody(choosePanchoSchema), async (req, res) => {
  res.status(200).json(await service.choosePancho(req.user, req.body));
});

// POST /api/pets/me/inventory -> 201 (buy a cosmetic)
router.post("/me/inventory", validateBody(buyCosmeticSchema), async (req, res) => {
  res.status(201).json(await service.buyCosmetic(req.user, req.body.cosmeticId));
});

// PUT /api/pets/me/equipped -> 200 (equip / unequip by slot)
router.put("/me/equipped", validateBody(equipSchema), async (req, res) => {
  res.status(200).json(await service.equipCosmetics(req.user, req.body));
});

export default router;
