// TEMPORARY SEAM (see server/utils/jwt.js). Reads the session cookie, loads the user
// and exposes it as req.user. The role always comes from the database, never from the client.
import AppError from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/index.js";

// Cookie name is an assumption until UN-104 defines it.
export const SESSION_COOKIE = "session";
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function readCookie(req, name) {
  const parts = (req.headers.cookie || "").split(";");
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    const equalsAt = part.indexOf("=");
    if (equalsAt === -1) continue;
    if (part.slice(0, equalsAt) !== name) continue;
    try {
      return decodeURIComponent(part.slice(equalsAt + 1));
    } catch {
      return null;
    }
  }
  return null;
}

export async function authenticate(req, res, next) {
  const token = readCookie(req, SESSION_COOKIE);
  const payload = token ? verifyToken(token) : null;
  if (!payload || !OBJECT_ID_REGEX.test(String(payload.sub))) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, "UNAUTHORIZED", "Authentication required");

  req.user = user;
  next();
}

// Usage: authorize("teacher"). Wrong role -> 403 FORBIDDEN (ADR 7.2).
export function authorize(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      throw new AppError(403, "FORBIDDEN", `This action is only available to a ${role}`);
    }
    next();
  };
}
