import { Router } from "express";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { logError } from "../utils/safeLog.js";

const router = Router();

// ADR 7.5: pública. Hace un ping REAL a Mongo; si falla responde 503 (útil para monitores y para
// ver de un vistazo si Atlas está accesible desde Vercel).
router.get("/", async (req, res) => {
  let connected = false;
  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    connected = true;
  } catch (error) {
    logError(error, req);
  }
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    database: connected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default router;
