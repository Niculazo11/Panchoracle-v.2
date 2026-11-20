import mongoose from "mongoose";

const { Schema } = mongoose;

// Same email pattern as frontend (src/lib/validation.js).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ADR 8.1 (revision 1) + ticket UN-102.
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minlength: 2, // same minimum as validateName() on frontend
      maxlength: 80, // technical decision: ADR doesn't define max length
    },

    // Team decision C1 (ADR 8.1, revision 1): OPTIONAL field with partial
    // unique index. Not required to avoid breaking POST /api/auth/register
    // (ADR 7.4 only sends name, email, password, role). No format pattern:
    // current frontend "username" is free text. Limits 3-30 are a
    // technical implementation decision (not in ADR).
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },

    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      lowercase: true, // ADR 8.1: "normalized to lowercase"
      maxlength: 254, // technical decision (standard email limit)
      match: [EMAIL_REGEX, "email is not valid"],
      unique: true, // ADR 8.1: unique index on email
    },

    // ADR 8.1: never exposed in API. select:false prevents accidental return;
    // login must request it with .select("+passwordHash").
    passwordHash: {
      type: String,
      required: [true, "passwordHash is required"],
      select: false,
    },

    role: {
      type: String,
      enum: { values: ["student", "teacher"], message: "role must be student or teacher" },
      required: [true, "role is required"],
    },

    // ADR 5.6 / 8.1: one classroom per user.
    classroomId: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      default: null,
      index: true, // ADR 8.1: index on classroomId
    },
  },
  {
    collection: "users",
    timestamps: { createdAt: true, updatedAt: false }, // ADR 8.1 only defines createdAt
  }
);

// Partial UNIQUE index (ADR 8.1): only applies to documents whose username is a
// string. This way multiple users without username don't clash.
userSchema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: "string" } } }
);

export default mongoose.models.User || mongoose.model("User", userSchema);