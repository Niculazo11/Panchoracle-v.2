import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.3. Create, edit, and delete only allowed BEFORE period.startDate
// (UN-107, ADR 6.2); "active assignment" is computed by query, not stored.
const assignmentSchema = new Schema(
  {
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: [true, "classroomId is required"],
    },
    // Points to classrooms.period.periodId (embedded, no "ref").
    periodId: {
      type: Schema.Types.ObjectId,
      required: [true, "periodId is required"],
    },
    title: {
      type: String,
      required: [true, "title is required"],
      trim: true,
      maxlength: 120, // technical decision
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000, // technical decision
    },
    dueAt: { type: Date, required: [true, "dueAt is required"] },
    // Teacher-uploaded file (team decision 2026-11-19): teachers can attach a file to the assignment
    // File bytes are stored in assignment_files collection (like submissions).
    fileName: { type: String, trim: true, maxlength: 200 },
    fileUrl: { type: String },
    fileMimeType: { type: String },
    fileStorageKey: { type: String },
    fileSize: { type: Number },
  },
  {
    collection: "assignments",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ADR 8.3: unambiguous ordering; multiple assignments can share the same dueAt (team decision 2026-11-19).
assignmentSchema.index({ classroomId: 1, periodId: 1, dueAt: 1 });

export default mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);