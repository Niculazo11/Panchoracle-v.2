// UN-103 · Contador de rate limit PERSISTIDO en MongoDB (colección "rate_limits").
// En Vercel cada invocación puede correr en una instancia distinta, así que la
// memoria del proceso no sirve para contar intentos. Es infraestructura de
// seguridad, no un modelo de dominio: por eso NO se agrega a models/index.js.
import mongoose from "mongoose";

const rateLimitSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // p. ej. "login:ip-email:<ip>:<hash>"
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true }, // fin de la ventana
  },
  { collection: "rate_limits", versionKey: false }
);

// Índice TTL: MongoDB borra el documento poco después de expiresAt. El monitor TTL
// corre cada ~60 s, así que el middleware también compara fechas por su cuenta.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimit || mongoose.model("RateLimit", rateLimitSchema);