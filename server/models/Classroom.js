import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8: "period" is EMBEDDED in classrooms (1:1, same lifecycle).
const periodSchema = new Schema(
  {
    // Identifies the cycle; referenced by assignments.periodId and pets.periodId.
    // Not a collection, so it doesn't have "ref".
    periodId: {
      type: Schema.Types.ObjectId,
      required: true,
      default: () => new mongoose.Types.ObjectId(),
    },
    startDate: { type: Date, required: [true, "period.startDate is required"] },
    endDate: {
      type: Date,
      required: [true, "period.endDate is required"],
      validate: {
        // ADR 7.4: startDate < endDate
        validator(value) {
          return !this.startDate || value > this.startDate;
        },
        message: "period.endDate must be after period.startDate",
      },
    },
    // ADR 8.2: denormalized counter; only increments before startDate (service rule).
    totalAssignments: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: "totalAssignments must be an integer" },
    },
  },
  { _id: false }
);

const classroomSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      maxlength: 100, // technical decision
    },

    // ADR 8.2: one classroom per teacher => unique.
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "teacherId is required"],
      unique: true,
    },

    // ADR 5.6 (D7): unique code. Format/length: PENDING in ADR section 12,
    // so no uppercase or pattern enforced; just trim + technical length limit.
    joinCode: {
      type: String,
      required: [true, "joinCode is required"],
      trim: true,
      uppercase: true, // ADR 8.2: stored in uppercase
      maxlength: 32, // technical decision
      unique: true,
    },

    period: { type: periodSchema, required: [true, "period is required"] },
  },
  {
    collection: "classrooms",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.models.Classroom || mongoose.model("Classroom", classroomSchema);