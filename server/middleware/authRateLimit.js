// UN-103 · Login and register rate limit with counter PERSISTED in MongoDB.
//
// Why memory isn't enough: in Vercel each request can be handled by a
// different instance (or a new one after a cold start), and their memory
// isn't shared. State lives in the "rate_limits" collection and is updated
// with a single atomic MongoDB operation, so concurrent instances
// count against the same document without losing attempts.
import { createHash } from "node:crypto";
import RateLimit from "../models/RateLimit.js";
import AppError from "../utils/AppError.js";

const MINUTE = 60 * 1000;

// N attempts allowed within the window; attempt N+1 gets 429.
// IP limits are intentionally high: in a classroom, dozens of students
// share the school's public IP (NAT). Adjust here if needed.
export const LOGIN_MAX_ATTEMPTS = 5; // per IP + email (stops brute force on one account)
export const LOGIN_IP_MAX_ATTEMPTS = 300; // per IP (stops trying many emails from one IP)
export const LOGIN_WINDOW_MS = 15 * MINUTE;
export const REGISTER_MAX_ATTEMPTS = 30; // per IP (a whole class registering)
export const REGISTER_IP_MAX_ATTEMPTS = 120;
export const REGISTER_WINDOW_MS = 60 * MINUTE;
export const JOIN_MAX_ATTEMPTS = 20; // per student: stops guessing 6-char classroom codes
export const JOIN_WINDOW_MS = 15 * MINUTE;

let indexesReady; // creates (once per instance) the unique index and TTL for rate_limits

// Increments the "key" counter in ONE atomic operation (pipeline update with
// $$NOW, the MongoDB server clock): if window expired, reset to 1.
async function hit(key, windowMs) {
  const expired = { $lte: [{ $ifNull: ["$expiresAt", new Date(0)] }, "$$NOW"] };
  const pipeline = [
    {
      $set: {
        count: { $cond: [expired, 1, { $add: ["$count", 1] }] },
        expiresAt: { $cond: [expired, { $add: ["$$NOW", windowMs] }, "$expiresAt"] },
      },
    },
  ];
  const options = { upsert: true, returnDocument: "after", updatePipeline: true };
  try {
    return await RateLimit.findOneAndUpdate({ key }, pipeline, options);
  } catch (error) {
    // Two instances created the same key at once: the second retries and updates.
    if (error.code === 11000) return RateLimit.findOneAndUpdate({ key }, pipeline, options);
    throw error;
  }
}

function createAuthRateLimit({ name, windowMs, rules, resetOnSuccess = false }) {
  return async function authRateLimit(req, res, next) {
    // Skip rate limiting only in the test environment, never on Vercel or in production
    // (a stray NODE_ENV=test there must not switch the protection off).
    if (process.env.NODE_ENV === "test" && !process.env.VERCEL) {
      return next();
    }

    indexesReady ??= RateLimit.init().catch((error) => {
      indexesReady = undefined;
      throw error;
    });
    await indexesReady;

    const ip = req.ip || "unknown";
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase().slice(0, 254) : null;
    // Email is stored as hash: the collection doesn't accumulate personal data.
    const emailHash = email && createHash("sha256").update(email).digest("hex").slice(0, 32);

    const userId = req.user?._id?.toString() ?? null;

    const keys = rules
      .filter((rule) => (!rule.byEmail || emailHash) && (!rule.byUser || userId))
      .map((rule) => ({
        key: rule.byUser
          ? `${name}:user:${userId}`
          : rule.byEmail
            ? `${name}:ip-email:${ip}:${emailHash}`
            : `${name}:ip:${ip}`,
        max: rule.max,
        byEmail: rule.byEmail,
      }));

    const docs = await Promise.all(keys.map((rule) => hit(rule.key, windowMs)));

    let retryAfter = 0;
    docs.forEach((doc, i) => {
      if (doc.count > keys[i].max) {
        retryAfter = Math.max(retryAfter, Math.ceil((doc.expiresAt - Date.now()) / 1000));
      }
    });
    if (retryAfter > 0) {
      res.set("Retry-After", String(retryAfter));
      throw new AppError(429, "RATE_LIMITED", "Too many attempts. Please try again later.");
    }

    // A successful access resets the IP+email counter (best effort: if the
    // instance freezes before deleting, the counter only becomes stricter).
    if (resetOnSuccess) {
      const emailKey = keys.find((rule) => rule.byEmail)?.key;
      if (emailKey) {
        res.on("finish", () => {
          if (res.statusCode < 400) RateLimit.deleteOne({ key: emailKey }).catch(() => {});
        });
      }
    }
    next();
  };
}

export const loginRateLimit = createAuthRateLimit({
  name: "login",
  windowMs: LOGIN_WINDOW_MS,
  resetOnSuccess: true,
  rules: [
    { byEmail: true, max: LOGIN_MAX_ATTEMPTS },
    { byEmail: false, max: LOGIN_IP_MAX_ATTEMPTS },
  ],
});

// Needs an authenticated user (runs after authenticate): counts attempts per student, not per IP,
// because a whole class shares the school's public IP.
export const joinRateLimit = createAuthRateLimit({
  name: "join",
  windowMs: JOIN_WINDOW_MS,
  rules: [{ byUser: true, max: JOIN_MAX_ATTEMPTS }],
});

export const registerRateLimit = createAuthRateLimit({
  name: "register",
  windowMs: REGISTER_WINDOW_MS,
  rules: [
    { byEmail: true, max: REGISTER_MAX_ATTEMPTS },
    { byEmail: false, max: REGISTER_IP_MAX_ATTEMPTS },
  ],
});