import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.5 + docs/submissions-api.md. Only metadata lives here: the bytes of a handed-in file are in
// `submission_files` (SubmissionFile), and a link is stored in `fileUrl` itself.
// Missed assignments do NOT create a document (they are derived from the absence).
const submissionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "assignmentId is required"],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "studentId is required"],
    },
    // "link": fileUrl is the link the student typed. "file": fileUrl is /api/submissions/:id/file.
    // Documents created before this field existed are links (the old placeholder submissions).
    kind: {
      type: String,
      enum: { values: ["link", "file"], message: "kind must be link or file" },
      default: "link",
    },
    fileName: { type: String, required: [true, "fileName is required"], trim: true, maxlength: 255 }, // technical decision
    fileUrl: { type: String, required: [true, "fileUrl is required"], trim: true, maxlength: 2048 }, // technical decision
    // Only meaningful for stored files; links have nothing in storage.
    storageKey: { type: String, trim: true, maxlength: 1024, default: "" }, // technical decision
    // "Always before assignment.dueAt" is checked by the service (it needs the assignment).
    submittedAt: { type: Date, default: Date.now },
    // ADR 8.5: the only current value is "submitted".
    status: {
      type: String,
      enum: { values: ["submitted"], message: "status can only be submitted" },
      default: "submitted",
    },
  },
  { collection: "submissions" } // no timestamps: the ADR uses submittedAt
);

// ADR 8.5: one submission per assignment and student.
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
