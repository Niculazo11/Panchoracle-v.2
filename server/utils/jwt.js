// UN-104 · Utilidades JWT para autenticación
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en variables de entorno");
}

/**
 * Firma un token JWT con el payload dado y expiración en segundos
 * @param {Object} payload - Payload del token (ej: { sub: userId })
 * @param {number} expiresInSeconds - Expiración en segundos
 * @returns {string} Token JWT firmado
 */
export function signToken(payload, expiresInSeconds) {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: expiresInSeconds,
  });
}

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object|null} Payload decodificado o null si es inválido/expirado
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    // Token inválido, expirado, malformado, etc.
    return null;
  }
}