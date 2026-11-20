import mongoose from "mongoose";

const { Schema } = mongoose;

// Bytes of the files teachers attach to assignments. They live in their own
// collection so the `assignments` documents stay small and list queries never load a file.
const assignmentFileSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "assignmentId is required"],
    },
    mimeType: {
      type: String,
      required: [true, "mimeType is required"],
      enum: {
        values: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        message: "mimeType is not allowed",
      },
    },
    size: { type: Number, required: [true, "size is required"], min: 1 },
    data: { type: Buffer, required: [true, "data is required"] },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "assignment_files" }
);

// One file per assignment.
assignmentFileSchema.index({ assignmentId: 1 }, { unique: true });

export default mongoose.models.AssignmentFile || mongoose.model("AssignmentFile", assignmentFileSchema);