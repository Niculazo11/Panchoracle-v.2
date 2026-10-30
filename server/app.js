//Configura Express y exporta la app (export default app) sin llamar a listen.
//Veremos que ensureDb solo está en /api/health y no en todo /api.

import express from "express";
import { corsMiddleware } from "./config/cors.js";
import { ensureDb } from "./config/db.js";
import healthRouter from "./routes/health.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.use(corsMiddleware);
app.use(express.json());

// "ensureDb" asegura que Mongo esté conectado (reutiliza la conexión cacheada).
app.use("/api/health", ensureDb, healthRouter);

app.use(notFoundHandler); // después de todas las rutas
app.use(errorHandler); // siempre al final

export default app;