import mongoose from "mongoose";

const { Schema } = mongoose;

// Bytes of the files students hand in (docs/submissions-api.md, "Storage"). They live in their own
// collection so the `submissions` documents stay small and list queries never load a file.
const submissionFileSchema = new Schema(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: [true, "submissionId is required"],
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
  { collection: "submission_files" }
);

// One file per submission.
submissionFileSchema.index({ submissionId: 1 }, { unique: true });

export default mongoose.models.SubmissionFile || mongoose.model("SubmissionFile", submissionFileSchema);
