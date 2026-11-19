import express from "express";
import { corsMiddleware } from "./config/cors.js";
import { ensureDb } from "./config/db.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import classroomsRouter from "./routes/classrooms.js";
import assignmentsRouter from "./routes/assignments.js";
import petsRouter from "./routes/pets.js";
import cosmeticsRouter from "./routes/cosmetics.js";
import minigamesRouter from "./routes/minigames.js";
import submissionsRouter from "./routes/submissions.js";
import { authenticate } from "./middleware/authenticate.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders, sanitizeInput, hideSensitiveFields } from "./middleware/security.js";
import { isSubmissionUpload } from "./config/submissions.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(corsMiddleware);
// 10 kb for every JSON body, except the submission upload: its route reads its own (bigger)
// body after authentication (routes/assignments.js).
const smallJson = express.json({ limit: "10kb" });
app.use((req, res, next) => (isSubmissionUpload(req) ? next() : smallJson(req, res, next)));
app.use(sanitizeInput);
app.use(hideSensitiveFields);

app.use("/api/health", healthRouter); // public; reports the database status (ADR 7.2)
app.use("/api/auth", ensureDb, authRouter);
app.use("/api/me", ensureDb, authenticate, meRouter);
app.use("/api/classrooms", ensureDb, authenticate, classroomsRouter);
app.use("/api/assignments", ensureDb, authenticate, assignmentsRouter);
app.use("/api/pets", ensureDb, authenticate, petsRouter);
app.use("/api/cosmetics", ensureDb, authenticate, cosmeticsRouter);
app.use("/api/minigames", ensureDb, authenticate, minigamesRouter);
app.use("/api/submissions", ensureDb, authenticate, submissionsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;