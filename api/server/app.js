//Configura Express y exporta la app (export default app) sin llamar a listen.
//Veremos que ensureDb solo está en /api/health y no en todo /api.

import express from "express";
import { corsMiddleware } from "./config/cors.js";
import { ensureDb } from "./config/db.js";
import healthRouter from "./routes/health.js";
import classroomsRouter from "./routes/classrooms.js";
import { authenticate } from "./middleware/authenticate.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders, sanitizeInput, hideSensitiveFields } from "./middleware/security.js";
import { loginRateLimit, registerRateLimit } from "./middleware/authRateLimit.js";
import { validateBody } from "./middleware/validateBody.js";
import { loginSchema, registerSchema } from "./validators/auth.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // UN-103: detrás de Vercel, req.ip = IP real del cliente (la usa el rate limit)
app.use(securityHeaders); // UN-103: helmet
app.use(corsMiddleware);
app.use(express.json({ limit: "10kb" })); // UN-103: límite de tamaño del body
app.use(sanitizeInput); // UN-103: elimina operadores NoSQL ($ne, $gt, ...)
app.use(hideSensitiveFields); // UN-103: ninguna respuesta incluye passwordHash

// UN-103: protección de login y registro (rate limit en MongoDB + validación estricta).
// Solo ejecutan comprobaciones y siguen con next(): el handler real lo agrega UN-104
// montando su router en "/api/auth" DESPUÉS de estas líneas.
app.post("/api/auth/login", ensureDb, loginRateLimit, validateBody(loginSchema));
app.post("/api/auth/register", ensureDb, registerRateLimit, validateBody(registerSchema));

// "ensureDb" asegura que Mongo esté conectado (reutiliza la conexión cacheada).
app.use("/api/health", ensureDb, healthRouter);

// UN-106: classrooms. Needs the database and a logged-in user (cookie session).
app.use("/api/classrooms", ensureDb, authenticate, classroomsRouter);

app.use(notFoundHandler); // después de todas las rutas
app.use(errorHandler); // siempre al final

export default app;