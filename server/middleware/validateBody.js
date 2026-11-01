// UN-103 · Aplica un esquema de Zod a req.body. Si falla → 400 VALIDATION_ERROR
// (formato de error del ADR 7.6). Si pasa, req.body queda con los datos ya
// tipados y normalizados.
import AppError from "../utils/AppError.js";

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ");
      return next(new AppError(400, "VALIDATION_ERROR", `Datos inválidos — ${detail}`));
    }
    req.body = result.data;
    next();
  };
}