import AppError from "../utils/AppError.js";
import { logError } from "../utils/safeLog.js";

// Runs when no route matched: 404 NOT_FOUND
export function notFoundHandler(req, res, next) {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
  } else if (err.name === "ValidationError" || err.name === "CastError") {
    // Mongoose rejected a value: it is the client's fault. The offending value is never echoed.
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid data";
  } else if (err.type === "entity.parse.failed") {
    // Malformed JSON in the request body
    status = 400;
    code = "VALIDATION_ERROR";
    message = "The request body is not valid JSON";
  } else if (err.type === "entity.too.large") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "The request body is too large";
  } else if (/^Mongo(ServerSelection|Network|NetworkTimeout|NotConnected|PoolCleared)/.test(err.name)) {
    // Atlas became unreachable AFTER connecting (the cached connection still looks "alive" but drops).
    status = 503;
    code = "SERVICE_UNAVAILABLE";
    message = "Database unavailable. Please try again in a moment.";
    logError(err, req);
  } else {
    // Unexpected error: the real detail only goes to the server console,
    // never to the client.
    logError(err, req);
  }

  res.status(status).json({ error: { code, message } });
}