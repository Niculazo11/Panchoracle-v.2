import mongoose from "mongoose";

const { Schema } = mongoose;

const isFiniteNumber = (value) => Number.isFinite(value);

// ADR 8.4: Pancho. One document per student, reset each period.
// NO revive fields exist (ADR 5.4). healthAdjustment/healthRestoreLog only forgive
// penalties of a LIVE Pancho (UN-108, ADR Rev. 2.3); a dead Pancho is never restored.
const petSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ownerId is required"],
      unique: true, // ADR 8.4: unique on ownerId
    },
    periodId: {
      type: Schema.Types.ObjectId,
      required: [true, "periodId is required"],
    },
    name: {
      type: String,
      trim: true,
      default: "Pancho", // same default name as defaultDog() on frontend
      maxlength: 50, // technical decision
    },
    // ADR 5.3: range 0-100, initial value 100. NOT forced to integer: ADR
    // persists health without rounding (100 / totalAssignments can be decimal).
    health: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      validate: { validator: isFiniteNumber, message: "health must be a number" },
    },
    // Snapshot; current value calculated on each request (ADR 5.3).
    hunger: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      validate: { validator: isFiniteNumber, message: "hunger must be a number" },
    },
    // UN-108 [Rev. 2.3]: health points teacher forgave (e.g., medical excuse).
    // Added to base calculation: health = clamp(100 - missed*100/total + healthAdjustment, 0, 100).
    // Only increases (restore-health) and resets to 0 when new period starts.
    healthAdjustment: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      validate: { validator: isFiniteNumber, message: "healthAdjustment must be a number" },
    },
    // UN-108 [Rev. 2.3]: who restored how much and why (max 50 entries, most recent).
    healthRestoreLog: {
      type: [
        new Schema(
          {
            at: { type: Date, required: true },
            teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true },
            points: { type: Number, required: true, min: 0 },
            healthBefore: { type: Number, required: true },
            healthAfter: { type: Number, required: true },
            reason: { type: String, required: true, maxlength: 200 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    // UN-301: chosen Pancho (id derived from dog.ceo URL and image). null until
    // student chooses in /choosePancho; client redirects while null.
    panchoId: { type: String, trim: true, maxlength: 100, default: null },
    imgUrl: { type: String, trim: true, maxlength: 500, default: null },
    // ADR 8.4: integer balance. ADR does NOT define initial coins (frontend
    // uses 270), so required without default: decided by whoever creates Pancho (classroom join).
    coins: {
      type: Number,
      required: [true, "coins is required"],
      min: 0,
      validate: { validator: Number.isInteger, message: "coins must be an integer" },
    },
    // ADR uses lowercase ("alive" | "dead"); current frontend uses "ALIVE"/"DEAD".
    status: {
      type: String,
      enum: { values: ["alive", "dead"], message: "status must be alive or dead" },
      default: "alive",
    },
        // [Rev. 2] purchased cosmeticIds, no duplicates.
    inventory: {
      type: [Number],
      default: [],
      validate: {
        validator: (v) => v.every(Number.isInteger) && new Set(v).size === v.length,
        message: "inventory does not allow duplicates or non-integer values",
      },
    },
    // [Rev. 2] slot -> cosmeticId | null
    equipped: {
      head: { type: Number, default: null },
      face: { type: Number, default: null },
      neck: { type: Number, default: null },
      body: { type: Number, default: null },
    },
    // Which assignment `currentAssignmentSteps` belongs to (assignment id, or the default task id).
    // Progress of another assignment is ignored, so unfinished steps of a missed task never carry
    // over to the next one.
    currentAssignmentStepsFor: { type: String, default: null, maxlength: 40 },
    // When the student last claimed a minigame reward (cooldown, claimed atomically).
    lastMinigameAt: { type: Date, default: null },
    // UN-302: step progress for current assignment (1-4, true/false). Reset on submit.
    currentAssignmentSteps: {
      type: [Boolean],
      default: [false, false, false, false],
      validate: {
        validator: (v) => v.length === 4 && v.every((val) => typeof val === "boolean"),
        message: "currentAssignmentSteps must be array of 4 booleans",
      },
    },
  },
  {
    collection: "pets",
    timestamps: true, // ADR 8.4: createdAt y updatedAt
  }
);

export default mongoose.models.Pet || mongoose.model("Pet", petSchema);