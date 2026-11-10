// UN-103 · Rate limit de login y registro con contador PERSISTIDO en MongoDB.
//
// Por qué no basta la memoria: en Vercel cada petición puede atenderla una
// instancia distinta (o una nueva tras un cold start), y su memoria no se
// comparte. El estado vive en la colección "rate_limits" y se actualiza con una
// sola operación atómica de MongoDB, así que varias instancias concurrentes
// cuentan sobre el mismo documento sin perder intentos.
import { createHash } from "node:crypto";
import RateLimit from "../models/RateLimit.js";
import AppError from "../utils/AppError.js";

const MINUTE = 60 * 1000;

// N intentos permitidos dentro de la ventana; el intento N+1 recibe 429.
// Los topes por IP son altos a propósito: en un aula, decenas de estudiantes
// comparten la IP pública del colegio (NAT). Ajustar aquí si hace falta.
export const LOGIN_MAX_ATTEMPTS = 5; // por IP + email (frena fuerza bruta a una cuenta)
export const LOGIN_IP_MAX_ATTEMPTS = 10; // por IP (frena probar muchos emails desde una IP)
export const LOGIN_WINDOW_MS = 15 * MINUTE;
export const REGISTER_MAX_ATTEMPTS = 30; // por IP (una clase completa registrándose)
export const REGISTER_WINDOW_MS = 60 * MINUTE;

let indexesReady; // crea (una vez por instancia) el índice único y el TTL de rate_limits

// Incrementa el contador de "key" en UNA operación atómica (pipeline update con
// $$NOW, el reloj del servidor MongoDB): si la ventana expiró, reinicia en 1.
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
    // Dos instancias crearon la misma key a la vez: la segunda reintenta y actualiza.
    if (error.code === 11000) return RateLimit.findOneAndUpdate({ key }, pipeline, options);
    throw error;
  }
}

function createAuthRateLimit({ name, windowMs, rules, resetOnSuccess = false }) {
  return async function authRateLimit(req, res, next) {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === "test") {
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
    // El email se guarda como hash: la colección no acumula datos personales.
    const emailHash = email && createHash("sha256").update(email).digest("hex").slice(0, 32);

    const keys = rules
      .filter((rule) => !rule.byEmail || emailHash)
      .map((rule) => ({
        key: rule.byEmail ? `${name}:ip-email:${ip}:${emailHash}` : `${name}:ip:${ip}`,
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
      throw new AppError(429, "TOO_MANY_REQUESTS", "Demasiados intentos. Inténtalo de nuevo más tarde.");
    }

    // Un acceso correcto reinicia el contador IP+email (mejor esfuerzo: si la
    // instancia se congela antes de borrar, el contador solo queda más estricto).
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

export const registerRateLimit = createAuthRateLimit({
  name: "register",
  windowMs: REGISTER_WINDOW_MS,
  rules: [
    { byEmail: true, max: REGISTER_MAX_ATTEMPTS },
    { byEmail: false, max: REGISTER_IP_MAX_ATTEMPTS },
  ],
});