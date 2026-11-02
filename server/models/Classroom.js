import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8: "period" va EMBEBIDO en classrooms (1:1, mismo ciclo de vida).
const periodSchema = new Schema(
  {
    // Identifica el ciclo; lo referencian assignments.periodId y pets.periodId.
    // No es una colección, por eso no lleva "ref".
    periodId: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => new mongoose.Types.ObjectId(),
    },
    startDate: { type: Date, required: [true, "period.startDate es obligatorio"] },
    endDate: {
      type: Date,
      required: [true, "period.endDate es obligatorio"],
      validate: {
        // ADR 7.4: startDate < endDate
        validator(value) {
          return !this.startDate || value > this.startDate;
        },
        message: "period.endDate debe ser posterior a period.startDate",
      },
    },
    // ADR 8.2: contador denormalizado; solo sube antes de startDate (regla del servicio).
    totalAssignments: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: "totalAssignments debe ser entero" },
    },
  },
  { _id: false }
);

const classroomSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name es obligatorio"],
      trim: true,
      maxlength: 100, // decisión técnica
    },

    // ADR 8.2: un classroom por profesor => único.
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "teacherId es obligatorio"],
      unique: true,
    },

    // ADR 5.6 (D7): código único. Formato/longitud: PENDIENTE en ADR sección 12,
    // por eso no se fuerza mayúsculas ni patrón; solo trim + un tope técnico de longitud.
    joinCode: {
      type: String,
      required: [true, "joinCode es obligatorio"],
      trim: true,
      maxlength: 32, // decisión técnica
      unique: true,
    },

    period: { type: periodSchema, required: [true, "period es obligatorio"] },
  },
  {
    collection: "classrooms",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.models.Classroom || mongoose.model("Classroom", classroomSchema);