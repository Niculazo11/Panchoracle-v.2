import mongoose from "mongoose";

const { Schema } = mongoose;

const isFiniteNumber = (value) => Number.isFinite(value);

// ADR 8.4: Pancho. Un documento por estudiante, reiniciado en cada periodo.
// NO existen campos para revivir (ADR 5.4). healthAdjustment/healthRestoreLog solo perdonan
// penalizaciones de un Pancho VIVO (UN-108, ADR Rev. 2.3); un Pancho dead nunca se restaura.
const petSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ownerId es obligatorio"],
      unique: true, // ADR 8.4: único en ownerId
    },
    periodId: {
      type: Schema.Types.ObjectId,
      required: [true, "periodId es obligatorio"],
    },
    name: {
      type: String,
      trim: true,
      default: "Pancho", // mismo nombre por defecto que defaultDog() del frontend
      maxlength: 50, // decisión técnica
    },
    // ADR 5.3: rango 0-100, valor inicial 100. NO se fuerza entero: el ADR
    // persiste health sin redondear (100 / totalAssignments puede ser decimal).
    health: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      validate: { validator: isFiniteNumber, message: "health debe ser un número" },
    },
    // Snapshot; el valor vigente se calcula en cada petición (ADR 5.3).
    hunger: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      validate: { validator: isFiniteNumber, message: "hunger debe ser un número" },
    },
    // UN-108 [Rev. 2.3]: puntos de salud que el profesor perdonó (p. ej. una excusa médica).
    // Se SUMAN al cálculo base: health = clamp(100 - missed*100/total + healthAdjustment, 0, 100).
    // Solo crece (restore-health) y vuelve a 0 al empezar un nuevo periodo.
    healthAdjustment: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      validate: { validator: isFiniteNumber, message: "healthAdjustment debe ser un número" },
    },
    // UN-108 [Rev. 2.3]: quién restauró cuánto y por qué (máximo 50 entradas, las más recientes).
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
    // UN-301: Pancho elegido (id derivado de la URL de dog.ceo e imagen). null hasta que
    // el estudiante lo elige en /choosePancho; el cliente redirige mientras sea null.
    panchoId: { type: String, trim: true, maxlength: 100, default: null },
    imgUrl: { type: String, trim: true, maxlength: 500, default: null },
    // ADR 8.4: saldo entero. El ADR NO define las monedas iniciales (el
    // frontend usa 270), por eso es obligatorio y sin default: lo decide quien
    // cree a Pancho (join del classroom).
    coins: {
      type: Number,
      required: [true, "coins es obligatorio"],
      min: 0,
      validate: { validator: Number.isInteger, message: "coins debe ser entero" },
    },
    // ADR usa minúsculas ("alive" | "dead"); el frontend actual usa "ALIVE"/"DEAD".
    status: {
      type: String,
      enum: { values: ["alive", "dead"], message: "status debe ser alive o dead" },
      default: "alive",
    },
        // [Rev. 2] cosmeticId comprados, sin duplicados.
    inventory: {
      type: [Number],
      default: [],
      validate: {
        validator: (v) => v.every(Number.isInteger) && new Set(v).size === v.length,
        message: "inventory no admite duplicados ni valores no enteros",
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