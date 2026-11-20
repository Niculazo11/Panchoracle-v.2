import mongoose from "mongoose";

const { Schema } = mongoose;

const isFiniteNumber = (value) => Number.isFinite(value);

// ADR 8.4: Pancho. Un documento por estudiante, reiniciado en cada periodo.
// NO existen campos para revivir (ADR 5.4). healthAdjustment/healthRestoreLog solo registran las
// penalizaciones que el profesor perdonó a un Pancho VIVO (UN-108, ADR Rev. 2.3); un Pancho dead
// nunca se restaura.
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
    // Rango 0-100, valor inicial 100. Solo baja de 10 en 10, una vez por tarea vencida sin entrega
    // (ver petStateService.js); nunca decae con el tiempo ni cambia al entregar una tarea.
    health: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      validate: { validator: isFiniteNumber, message: "health debe ser un número" },
    },
    // Snapshot; el valor vigente se calcula en cada petición como cuenta regresiva hasta dueAt.
    hunger: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
      validate: { validator: isFiniteNumber, message: "hunger debe ser un número" },
    },
    // Tareas vencidas sin entrega cuya penalización de -10 de salud YA se aplicó. Es lo que hace
    // idempotente el cobro: leer /api/me/game muchas veces nunca descuenta dos veces la misma tarea.
    // Se vacía al empezar un periodo nuevo.
    penalizedAssignments: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    // UN-108 [Rev. 2.3]: total de puntos de salud que el profesor perdonó (p. ej. una excusa
    // médica). Es solo un registro: la salud perdonada ya se devuelve en `health` al restaurar.
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
    // When the student last claimed a minigame reward (cooldown, claimed atomically).
    lastMinigameAt: { type: Date, default: null },
  },
  {
    collection: "pets",
    timestamps: true, // ADR 8.4: createdAt y updatedAt
  }
);

export default mongoose.models.Pet || mongoose.model("Pet", petSchema);