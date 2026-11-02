import cors from "cors";
import AppError from "../utils/AppError.js";

const LOCALHOST_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function getExtraOrigins() {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",").map((o) => o.trim()).filter(Boolean);
}

function isSameOrigin(origin, req) {
  try {
    const host = req.get("x-forwarded-host") || req.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function isAllowed(origin, req) {
  return (
    isSameOrigin(origin, req) ||
    (!process.env.VERCEL && LOCALHOST_REGEX.test(origin)) ||
    getExtraOrigins().includes(origin)
  );
}

export const corsMiddleware = cors((req, callback) => {
  const origin = req.get("origin");
  if (!origin || isAllowed(origin, req)) return callback(null, { origin: false });
  callback(new AppError(403, "FORBIDDEN", "Origen no permitido"));
});