import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { logError, redact } from "../utils/safeLog.js";

// "global" sobrevive entre invocaciones de una función serverless mientras
// Vercel la mantenga "caliente": guardamos ahí la conexión para reutilizarla.
const cache = (global.__mongooseCache ??= { conn: null, promise: null });
const IS_SERVERLESS = Boolean(process.env.VERCEL);

// Registrar los listeners UNA sola vez por proceso.
if (!global.__mongooseListeners) {
  global.__mongooseListeners = true;
  mongoose.connection.on("error", (error) => console.error("[mongo] error:", redact(error.message)));
  mongoose.connection.on("disconnected", () => console.warn("[mongo] desconectado"));
}

export async function connectDB() {
  if (cache.conn) return cache.conn; // ya conectado: reutilizar

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Falta la variable de entorno MONGODB_URI");
    }
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
      // Atlas M0 admite ~500 conexiones en total. Cada instancia serverless abre su propio
      // pool, así que se mantiene pequeño para no agotar el cupo.
      maxPoolSize: IS_SERVERLESS ? 5 : 10,
      // En serverless NO se crean índices en cada cold start: se crean una vez con `npm run db:indexes`.
      autoIndex: !IS_SERVERLESS,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null; // si falló, permitir reintentar en la próxima petición
    throw error;
  }
  return cache.conn;
}

// Middleware para las rutas que SÍ necesitan base de datos.
// Si Mongo no responde -> 503 (no un 500 genérico) y el detalle va al log, ya redactado.
export async function ensureDb(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    logError(error, req);
    next(new AppError(503, "SERVICE_UNAVAILABLE", "Base de datos no disponible. Inténtalo de nuevo en un momento."));
  }
}
