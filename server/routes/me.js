import { Router } from "express";
import { toUserJson } from "../utils/userJson.js";

const router = Router();
router.get("/", (req, res) => res.json({ user: toUserJson(req.user) }));
export default router;