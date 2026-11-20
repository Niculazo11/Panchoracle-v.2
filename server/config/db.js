import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { logError, redact } from "../utils/safeLog.js";

// "global" survives across serverless function invocations while
// Vercel keeps it "warm": we store the connection there for reuse.
const cache = (global.__mongooseCache ??= { conn: null, promise: null });
const IS_SERVERLESS = Boolean(process.env.VERCEL);

// Register listeners ONCE per process.
if (!global.__mongooseListeners) {
  global.__mongooseListeners = true;
  mongoose.connection.on("error", (error) => console.error("[mongo] error:", redact(error.message)));
  mongoose.connection.on("disconnected", () => console.warn("[mongo] disconnected"));
}

export async function connectDB() {
  if (cache.conn) return cache.conn; // already connected: reuse

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI environment variable");
    }
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
      // Atlas M0 supports ~500 total connections. Each serverless instance opens its own
      // pool, so we keep it small to avoid exhausting the quota.
      maxPoolSize: IS_SERVERLESS ? 5 : 10,
      // In serverless, indexes are NOT created on every cold start: they're created once with `npm run db:indexes`.
      autoIndex: !IS_SERVERLESS,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null; // if failed, allow retry on next request
    throw error;
  }
  return cache.conn;
}

// Middleware for routes that DO need database.
// If Mongo doesn't respond -> 503 (not a generic 500) and details go to log, already redacted.
export async function ensureDb(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    logError(error, req);
    next(new AppError(503, "SERVICE_UNAVAILABLE", "Database unavailable. Please try again in a moment."));
  }
}
