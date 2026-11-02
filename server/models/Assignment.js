import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.3. Sin rutas de edición/borrado por diseño; la "tarea activa" se
// calcula por consulta, no se guarda.
const assignmentSchema = new Schema(
  {
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: [true, "classroomId es obligatorio"],
    },
    // Apunta a classrooms.period.periodId (embebido, sin "ref").
    periodId: {
      type: Schema.Types.ObjectId,
      required: [true, "periodId es obligatorio"],
    },
    title: {
      type: String,
      required: [true, "title es obligatorio"],
      trim: true,
      maxlength: 120, // decisión técnica
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000, // decisión técnica
    },
    dueAt: { type: Date, required: [true, "dueAt es obligatorio"] },
  },
  {
    collection: "assignments",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ADR 8.3: orden inequívoco y una sola tarea activa por periodo.
assignmentSchema.index({ classroomId: 1, periodId: 1, dueAt: 1 }, { unique: true });

export default mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);