import mongoose from "mongoose";

const { Schema } = mongoose;

const isFiniteNumber = (value) => Number.isFinite(value);

// ADR 8.4: Pancho. Un documento por estudiante, reiniciado en cada periodo.
// NO existen campos para revivir (ADR 5.4).
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
  },
  {
    collection: "pets",
    timestamps: true, // ADR 8.4: createdAt y updatedAt
  }
);

export default mongoose.models.Pet || mongoose.model("Pet", petSchema);