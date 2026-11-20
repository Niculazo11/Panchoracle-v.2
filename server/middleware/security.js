// UN-103 · Hardening: headers (helmet), NoSQL sanitization and output protection.
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

// Secure headers with helmet default configuration.
export const securityHeaders = helmet();

// express-mongo-sanitize@2.2.0 is NOT compatible with Express 5: its middleware does
// `req.query = ...` and in Express 5 `req.query` is a getter only (throws error and
// responds 500). That's why we use its `sanitize()` function (which mutates in place)
// inside our own middleware. It removes keys starting with "$" or containing "."
// ($ne, $gt, $where, ...).
export function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object" && mongoSanitize.has(req.body)) {
    console.warn(`[security] NoSQL operators removed from body: ${req.method} ${req.path}`);
  }
  if (req.body && typeof req.body === "object") mongoSanitize.sanitize(req.body);

  // In Express 5 req.query is recalculated on each read: we pin a sanitized copy.
  const query = mongoSanitize.sanitize({ ...req.query });
  Object.defineProperty(req, "query", {
    value: query,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
}

// Global safety net: no API JSON response may include
// "passwordHash", regardless of which endpoint or query (.lean(), create(),
// populate, aggregations) generated it.
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