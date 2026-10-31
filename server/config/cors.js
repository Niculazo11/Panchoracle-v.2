import cors from "cors";
import AppError from "../utils/AppError.js";

// Lista blanca (UN-101): GitHub Pages del equipo + localhost + dominio(s) de Vercel.
const GITHUB_PAGES_ORIGIN = "https://niculazo11.github.io";
const LOCALHOST_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;


// El dominio de Vercel NO está en el ADR, así que se configura por variable de
// entorno: ALLOWED_ORIGINS=https://mi-app.vercel.app,https://otro.vercel.app
function getVercelOrigins() {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowed(origin) {
  return (
    origin === GITHUB_PAGES_ORIGIN ||
    LOCALHOST_REGEX.test(origin) ||
    getVercelOrigins().includes(origin)
  );
}

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Sin cabecera Origin (curl, Postman, mismo origen): se permite.
    if (!origin || isAllowed(origin)) return callback(null, true);
    callback(new AppError(403, "FORBIDDEN", "Origen no permitido por CORS"));
  },
});