// UN-103 · Validación estricta de login y registro (ADR 7.4).
// z.string() NO acepta objetos, arrays, números, booleanos ni null, y
// z.strictObject() rechaza claves que no estén en el contrato.
import { z } from "zod";

z.config(z.locales.es()); // mensajes de validación en español

// Mismo patrón que server/models/User.js y src/lib/validation.js.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .regex(EMAIL_REGEX, "email no es válido");

// POST /api/auth/login → { email, password }
export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1).max(128),
});

// POST /api/auth/register → { name, email, password, role, teacherCode? }
export const registerSchema = z.strictObject({
  name: z.string().trim().min(2).max(80), // mismos límites que User.name
  email,
  password: z.string().min(6).max(128), // mínimo 6 = validatePassword() del frontend
  role: z.enum(["student", "teacher"]),
  teacherCode: z.string().optional(), // requerido solo si role === "teacher" (validado en handler)
});