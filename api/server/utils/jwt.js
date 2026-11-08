// TEMPORARY SEAM. UN-104 (login) and UN-105 (auth middleware) do not exist yet.
// This is a minimal HS256 token (signed with JWT_SECRET) so the classroom routes can
// identify the user from the httpOnly cookie (ADR 5.2). When UN-104/UN-105 land, replace
// this file and server/middleware/authenticate.js with the real ones.
import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  if (!process.env.JWT_SECRET) throw new Error("Missing environment variable JWT_SECRET");
  return process.env.JWT_SECRET;
}

function sign(data) {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function signToken(payload, expiresInSeconds = 3600) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

// Returns the payload, or null when the token is malformed, tampered with or expired.
export function verifyToken(token) {
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;

  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`));
  const received = Buffer.from(parts[2]);
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
