// UN-104 · Utilidades JWT para autenticación
import jwt from "jsonwebtoken";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está definido en variables de entorno");
  return secret;
}

export function signToken(payload, expiresInSeconds = 3600) {
  return jwt.sign(payload, getSecret(), { algorithm: "HS256", expiresIn: expiresInSeconds });
}

// Devuelve el payload o null si el token es inválido/expirado.
export function verifyToken(token) {
  const secret = getSecret(); // un secreto ausente debe ser 500, no un 401 silencioso
  try {
    return jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}