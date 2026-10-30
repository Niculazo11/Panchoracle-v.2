//responde 200 con el estado y la hora en ISO 8601 UTC
//Se define como “mini-router” y app.js lo monta en /api/health

import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// GET /api/health  (se monta en app.js bajo "/api/health")
router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default router;