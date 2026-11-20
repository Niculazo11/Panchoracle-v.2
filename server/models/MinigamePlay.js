import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.6. Reward (5 coins) is set by server and its value lives in
// backend config (ADR section 8, "Principles"), not in this model.
const minigamePlaySchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "studentId is required"],
    },
    // Catalog of valid gameIds: PENDING in ADR section 12 => no enum.
    gameId: {
      type: String,
      required: [true, "gameId is required"],
      trim: true,
      maxlength: 50, // technical decision
    },
    reward: {
      type: Number,
      required: [true, "reward is required"],
      min: 0,
      validate: { validator: Number.isInteger, message: "reward must be an integer" },
    },
    playedAt: { type: Date, default: Date.now },
  },
  { collection: "minigame_plays" } // exact name from ADR/ticket
);

// ADR 8.6
minigamePlaySchema.index({ studentId: 1, playedAt: 1 });

export default mongoose.models.MinigamePlay || mongoose.model("MinigamePlay", minigamePlaySchema);