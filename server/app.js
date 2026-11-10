import express from "express";
import { corsMiddleware } from "./config/cors.js";
import { ensureDb } from "./config/db.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import meRouter from "./routes/me.js";
import classroomsRouter from "./routes/classrooms.js";
import { authenticate } from "./middleware/authenticate.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders, sanitizeInput, hideSensitiveFields } from "./middleware/security.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: "10kb" }));
app.use(sanitizeInput);
app.use(hideSensitiveFields);

app.use("/api/health", healthRouter); // público; reporta el estado de la BD (ADR 7.2)
app.use("/api/auth", ensureDb, authRouter);
app.use("/api/me", ensureDb, authenticate, meRouter);
app.use("/api/classrooms", ensureDb, authenticate, classroomsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;