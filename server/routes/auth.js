// UN-104 · API de autenticación (ADR 5.2, 7.4)
import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { toUserJson } from "../utils/userJson.js";
import AppError from "../utils/AppError.js";
import { validateBody } from "../middleware/validateBody.js";
import { loginRateLimit, registerRateLimit } from "../middleware/authRateLimit.js";
import { SESSION_COOKIE } from "../middleware/authenticate.js";
import { loginSchema, registerSchema } from "../validators/auth.js";

const router = Router();
const TOKEN_EXPIRY = 3600; // 1 hora
const COOKIE_OPTS = {
  httpOnly: true,
  secure: Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

function startSession(res, user) {
  const token = signToken({ sub: user._id.toString() }, TOKEN_EXPIRY);
  res.cookie(SESSION_COOKIE, token, { ...COOKIE_OPTS, maxAge: TOKEN_EXPIRY * 1000 });
}

// POST /api/auth/register
router.post("/register", registerRateLimit, validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, role, teacherCode } = req.body;

    if (role === "teacher") {
      const expected = process.env.TEACHER_CODE;
      if (!expected || teacherCode !== expected) {
        throw new AppError(403, "FORBIDDEN", "Código de profesor inválido");
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await User.create({ name, email, passwordHash, role });
    } catch (error) {
      if (error.code === 11000) throw new AppError(409, "CONFLICT", "El email ya está registrado");
      throw error;
    }

    startSession(res, user);
    res.status(201).json({ user: toUserJson(user) });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post("/login", loginRateLimit, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    const valid = user && (await bcrypt.compare(password, user.passwordHash));
    if (!valid) throw new AppError(401, "UNAUTHORIZED", "Credenciales inválidas");

    startSession(res, user);
    res.json({ user: toUserJson(user) });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, COOKIE_OPTS);
  res.status(204).send();
});

export default router;