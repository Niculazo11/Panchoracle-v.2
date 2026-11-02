import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.5. Solo metadata: el archivo vive en el almacenamiento externo.
// Las tareas incumplidas NO generan documento (se derivan por ausencia).
const submissionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "assignmentId es obligatorio"],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "studentId es obligatorio"],
    },
    fileName: { type: String, required: [true, "fileName es obligatorio"], trim: true, maxlength: 255 }, // decisión técnica
    fileUrl: { type: String, required: [true, "fileUrl es obligatorio"], trim: true, maxlength: 2048 }, // decisión técnica
    storageKey: { type: String, required: [true, "storageKey es obligatorio"], trim: true, maxlength: 1024 }, // decisión técnica
    // "Siempre < assignment.dueAt" lo valida el servicio (necesita la tarea).
    submittedAt: { type: Date, default: Date.now },
    // ADR 8.5: único valor actual "submitted".
    status: {
      type: String,
      enum: { values: ["submitted"], message: "status solo puede ser submitted" },
      default: "submitted",
    },
  },
  { collection: "submissions" } // sin timestamps: el ADR usa submittedAt
);

// ADR 8.5: una entrega por tarea y estudiante.
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.Submission || mongoose.model("Submission", submissionSchema);