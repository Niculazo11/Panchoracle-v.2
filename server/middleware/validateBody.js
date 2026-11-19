// UN-103 · Applies a Zod schema to req.body. If it fails → 400 VALIDATION_ERROR
// (error format of ADR 7.6). If it passes, req.body holds the typed, normalized data.
// validateQuery: the same for req.query (GET params).
import AppError from "../utils/AppError.js";

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ");
      return next(new AppError(400, "VALIDATION_ERROR", `Invalid data — ${detail}`));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join(".") || "query"}: ${issue.message}`)
        .join("; ");
      return next(new AppError(400, "VALIDATION_ERROR", `Invalid query parameters — ${detail}`));
    }
    req.query = result.data;
    next();
  };
}