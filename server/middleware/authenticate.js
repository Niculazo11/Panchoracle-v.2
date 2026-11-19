import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

export const SESSION_COOKIE = "session";
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function readCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1 || trimmed.slice(0, eq) !== name) continue;
    try { return decodeURIComponent(trimmed.slice(eq + 1)); } catch { return null; }
  }
  return null;
}

// The role always comes from the database, never from the client (ADR 5.2).
export async function authenticate(req, res, next) {
  const token = readCookie(req, SESSION_COOKIE);
  const payload = token ? verifyToken(token) : null;
  if (!payload || !OBJECT_ID_REGEX.test(String(payload.sub))) {
    throw new AppError(401, "UNAUTHORIZED", "Not authenticated");
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");
  req.user = user;
  next();
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission for this action");
    }
    next();
  };
}