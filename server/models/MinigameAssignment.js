import mongoose from "mongoose";

const { Schema } = mongoose;

// Teacher assigns a minigame to their classroom (UN-XXX)
// One assignment per minigameId per classroom (unique index)
const minigameAssignmentSchema = new Schema(
  {
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: [true, "classroomId is required"],
    },
    // Minigame identifier: "quiz", "memory", etc. (ADR 12: catalog pending => no enum)
    minigameId: {
      type: String,
      required: [true, "minigameId is required"],
      trim: true,
      maxlength: 50,
    },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "assignedBy is required"],
    },
  },
  { collection: "minigame_assignments" }
);

// A teacher cannot assign the same minigame twice to the same classroom
minigameAssignmentSchema.index({ classroomId: 1, minigameId: 1 }, { unique: true });
// To list assignments for a classroom sorted by date
minigameAssignmentSchema.index({ classroomId: 1, assignedAt: 1 });

export default mongoose.models.MinigameAssignment || mongoose.model("MinigameAssignment", minigameAssignmentSchema);