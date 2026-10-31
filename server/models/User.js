import mongoose from "mongoose";

const { Schema } = mongoose;

// Mismo patrón de correo que ya usa el frontend (src/lib/validation.js).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ADR 8.1 (revisión 1) + ticket UN-102.
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name es obligatorio"],
      trim: true,
      minlength: 2, // mismo mínimo que validateName() del frontend
      maxlength: 80, // decisión técnica: el ADR no define longitud máxima
    },

    // Decisión del equipo C1 (ADR 8.1, revisión 1): campo OPCIONAL con índice
    // único parcial. No es required para no romper POST /api/auth/register
    // (ADR 7.4 solo envía name, email, password, role). Sin patrón de formato:
    // el "username" actual del frontend es texto libre. Los límites 3-30 son
    // una decisión técnica de implementación (no están en el ADR).
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: [true, "email es obligatorio"],
      trim: true,
      lowercase: true, // ADR 8.1: "normalizado a minúsculas"
      maxlength: 254, // decisión técnica (límite estándar de correo)
      match: [EMAIL_REGEX, "email no es válido"],
      unique: true, // ADR 8.1: índice único en email
    },

    // ADR 8.1: nunca se expone en la API. select:false evita devolverlo por
    // accidente; el login deberá pedirlo con .select("+passwordHash").
    passwordHash: {
      type: String,
      required: [true, "passwordHash es obligatorio"],
      select: false,
    },

    role: {
      type: String,
      enum: { values: ["student", "teacher"], message: "role debe ser student o teacher" },
      required: [true, "role es obligatorio"],
    },

    // ADR 5.6 / 8.1: un solo classroom por usuario.
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      default: null,
      index: true, // ADR 8.1: índice en classroomId
    },
  },
  {
    collection: "users",
    timestamps: { createdAt: true, updatedAt: false }, // ADR 8.1 solo define createdAt
  }
);

// Índice único PARCIAL (ADR 8.1): solo aplica a documentos cuyo username es un
// string. Así varios usuarios sin username no chocan entre sí.
userSchema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: "string" } } }
);

export default mongoose.models.User || mongoose.model("User", userSchema);