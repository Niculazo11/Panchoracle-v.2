import { Router } from "express";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

const router = Router();

router.get("/", async (req, res) => {
  try { await connectDB(); } catch { /* se reporta como disconnected */ }
  res.status(200).json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default router;