// UN-103 · Logs sin datos sensibles.
// Todo lo que se escribe en consola por errores pasa por aquí. Nunca se loguea
// el body, las cookies ni los headers del request; solo método, ruta (sin query)
// y el error ya "limpiado".

const SENSITIVE_KEYS =
  "password|passwordHash|token|authorization|cookie|set-cookie|secret|api[_-]?key";

// Oculta credenciales de cadenas de conexión (mongodb://user:pass@host) y pares
// clave/valor sensibles ("password": "x", password=x, passwordHash: x ...).
export function redact(value) {
  return String(value ?? "")
    .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s/]+@/gi, "$1[REDACTED]@")
    .replace(
      new RegExp(`(["']?(?:${SENSITIVE_KEYS})["']?\\s*[:=]\\s*)("[^"]*"|'[^']*'|[^\\s,;}&]+)`, "gi"),
      "$1[REDACTED]"
    );
}

// Sustituye a console.error(err): NO imprime el objeto error completo, porque los
// errores de Mongoose/Mongo traen propiedades con valores del request (por
// ejemplo "value", "keyValue", "errors.*.value") que podrían contener un
// password o un passwordHash.
export function logError(err, req) {
  console.error(
    "[error]",
    JSON.stringify({
      method: req?.method,
      path: req?.path,
      name: err?.name,
      code: err?.code,
      message: redact(err?.message),
      stack: redact(err?.stack),
    })
  );
}