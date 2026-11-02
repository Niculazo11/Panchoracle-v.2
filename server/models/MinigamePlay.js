import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.6. La recompensa (5 coins) la fija el servidor y su valor vive en la
// configuración del backend (ADR sección 8, "Principios"), no en este modelo.
const minigamePlaySchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "studentId es obligatorio"],
    },
    // Catálogo de gameId válidos: PENDIENTE en ADR sección 12 => sin enum.
    gameId: {
      type: String,
      required: [true, "gameId es obligatorio"],
      trim: true,
      maxlength: 50, // decisión técnica
    },
    reward: {
      type: Number,
      required: [true, "reward es obligatorio"],
      min: 0,
      validate: { validator: Number.isInteger, message: "reward debe ser entero" },
    },
    playedAt: { type: Date, default: Date.now },
  },
  { collection: "minigame_plays" } // nombre exacto del ADR/ticket
);

// ADR 8.6
minigamePlaySchema.index({ studentId: 1, playedAt: 1 });

export default mongoose.models.MinigamePlay || mongoose.model("MinigamePlay", minigamePlaySchema);