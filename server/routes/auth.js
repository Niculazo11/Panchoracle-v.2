// UN-104 · API de autenticación (implementado por Karol + colaboración Isaac)
// Endpoints: POST /auth/register, POST /auth/login, GET /auth/me, POST /auth/logout

import { Router } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Pet from "../models/Pet.js";
import { signToken, verifyToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import { validateBody } from "../middleware/validateBody.js";
import { loginSchema, registerSchema } from "../validators/auth.js";

const router = Router();
const SESSION_COOKIE = "session";
const TOKEN_EXPIRY = 3600; // 1 hora (expiración corta)
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: TOKEN_EXPIRY * 1000,
};

// POST /api/auth/register
router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, role, teacherCode } = req.body;

    // Validar duplicado email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError(409, "CONFLICT", "El email ya está registrado");
    }

    // Validar TEACHER_CODE si role === "teacher"
    if (role === "teacher") {
      const expectedCode = process.env.TEACHER_CODE;
      if (!expectedCode || teacherCode !== expectedCode) {
        throw new AppError(403, "FORBIDDEN", "Código de profesor inválido");
      }
    }

    // Hash contraseña con bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
    });

    // Si es student, crear pet automáticamente (vacío, valores por defecto)
    if (role === "student") {
      // Necesitamos un periodId - por ahora usamos uno genérico
      // El periodId real se asignará al unirse a un classroom
      const placeholderPeriodId = new mongoose.Types.ObjectId();
      await Pet.create({
        ownerId: user._id,
        periodId: placeholderPeriodId,
        coins: 270, // monedas iniciales según ADR
      });
    }

    // Firmar JWT y guardar en cookie httpOnly
    const token = signToken({ sub: user._id }, TOKEN_EXPIRY);
    res.cookie(SESSION_COOKIE, token, COOKIE_OPTS);

    // Respuesta SIN passwordHash
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario INCLUYENDO passwordHash (select: false en modelo)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+passwordHash"
    );

    if (!user) {
      // Error genérico 401 sin revelar si usuario existe
      throw new AppError(401, "UNAUTHORIZED", "Credenciales inválidas");
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "UNAUTHORIZED", "Credenciales inválidas");
    }

    // Firmar JWT y cookie
    const token = signToken({ sub: user._id }, TOKEN_EXPIRY);
    res.cookie(SESSION_COOKIE, token, COOKIE_OPTS);

    // Respuesta SIN passwordHash
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get("/me", async (req, res, next) => {
  try {
    // Leer token de cookie
    const cookieHeader = req.headers.cookie || "";
    const token = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
      ?.split("=")[1];

    if (!token) {
      throw new AppError(401, "UNAUTHORIZED", "No autenticado");
    }

    const payload = verifyToken(token);
    if (!payload || !payload.sub) {
      throw new AppError(401, "UNAUTHORIZED", "Token inválido o expirado");
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Usuario no encontrado");
    }

    // Respuesta SIN passwordHash
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
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