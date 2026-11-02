// UN-103 · Hardening: cabeceras (helmet), saneado NoSQL y protección de salida.
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

// Cabeceras seguras con la configuración por defecto de helmet.
export const securityHeaders = helmet();

// express-mongo-sanitize@2.2.0 NO es compatible con Express 5: su middleware hace
// `req.query = ...` y en Express 5 `req.query` es solo un getter (lanza error y
// responde 500). Por eso se usa su función `sanitize()` (que modifica el objeto
// en sitio) dentro de este middleware propio. Elimina claves que empiecen por "$"
// o contengan "." ($ne, $gt, $where, ...).
export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object" && mongoSanitize.has(req.body)) {
    console.warn(`[security] Operadores NoSQL eliminados del body: ${req.method} ${req.path}`);
  }
  if (req.body && typeof req.body === "object") mongoSanitize.sanitize(req.body);

  // En Express 5 req.query se recalcula en cada lectura: se fija una copia saneada.
  const query = mongoSanitize.sanitize({ ...req.query });
  Object.defineProperty(req, "query", {
    value: query,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
}

// Red de seguridad global: ninguna respuesta JSON de la API puede incluir
// "passwordHash", sin importar qué endpoint o qué consulta (.lean(), create(),
// populate, agregaciones) la haya generado.
export function hideSensitiveFields(req, res, next) {
  const json = res.json.bind(res);
  res.json = (body) =>
    json(
      body === undefined
        ? body
        : JSON.parse(JSON.stringify(body), (key, value) => (key === "passwordHash" ? undefined : value))
    );
  next();
}