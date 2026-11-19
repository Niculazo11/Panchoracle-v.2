import mongoose from "mongoose";

const { Schema } = mongoose;

// Teacher assigns a minigame to their classroom (UN-XXX)
// One assignment per minigameId per classroom (unique index)
const minigameAssignmentSchema = new Schema(
  {
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: [true, "classroomId es obligatorio"],
    },
    // Minigame identifier: "quiz", "memory", etc. (ADR 12: catálogo pendiente => sin enum)
    minigameId: {
      type: String,
      required: [true, "minigameId es obligatorio"],
      trim: true,
      maxlength: 50,
    },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "assignedBy es obligatorio"],
    },
  },
  { collection: "minigame_assignments" }
);

// Un profesor no puede asignar el mismo minijuego dos veces al mismo salón
minigameAssignmentSchema.index({ classroomId: 1, minigameId: 1 }, { unique: true });
// Para listar asignaciones de un salón ordenadas por fecha
minigameAssignmentSchema.index({ classroomId: 1, assignedAt: 1 });

export default mongoose.models.MinigameAssignment || mongoose.model("MinigameAssignment", minigameAssignmentSchema);