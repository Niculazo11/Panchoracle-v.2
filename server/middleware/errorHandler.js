import AppError from "../utils/AppError.js";
import { logError } from "../utils/safeLog.js";

//Se ejecuta cuando ninguna ruta coincidió, osea 404 NOT_FOUND
export function notFoundHandler(req, res, next) {
  next(new AppError(404, "NOT_FOUND", "Ruta no encontrada"));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Error interno del servidor";

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
  } else if (err.type === "entity.parse.failed") {
    
    // JSON mal formado en el cuerpo de la petición
    status = 400;
    code = "VALIDATION_ERROR";
    message = "El cuerpo de la petición no es un JSON válido";
  } else if (err.type === "entity.too.large") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "El cuerpo de la petición es demasiado grande";
  } else if (/^Mongo(ServerSelection|Network|NetworkTimeout|NotConnected|PoolCleared)/.test(err.name)) {
    // Atlas inalcanzable DESPUÉS de haber conectado (la conexión cacheada sigue "viva" pero cae).
    status = 503;
    code = "SERVICE_UNAVAILABLE";
    message = "Base de datos no disponible. Inténtalo de nuevo en un momento.";
    logError(err, req);
  } else {

    // Error inesperado: el detalle real solo va a la consola del servidor,
    // nunca al cliente.
    logError(err, req);
  }

  res.status(status).json({ error: { code, message } });
}