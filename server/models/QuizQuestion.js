import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.8 / UN-102. Fields come 1:1 from
// src/pages/minigames/quizQuestions.js (id, prompt, options, correctIndex).
// This file ONLY defines the model: seed and frontend migration
// correspond to UN-111.
const quizQuestionSchema = new Schema(
  {
    // Natural key ("q1", "q2", ...): client answers reference it.
    questionId: {
      type: String,
      required: [true, "questionId is required"],
      unique: true,
      trim: true,
      maxlength: 30,
    },
    prompt: { type: String, required: [true, "prompt is required"], trim: true, maxlength: 300 }, // length: technical decision
    options: {
      type: [{ type: String, trim: true, required: true, maxlength: 150 }], // length: technical decision
      validate: {
        // Technical decision: minimum 2 options (today all have 4).
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: "options must have at least 2 options",
      },
    },
    correctIndex: {
      type: Number,
      required: [true, "correctIndex is required"],
      min: 0,
      validate: {
        validator(value) {
          return Number.isInteger(value) && Array.isArray(this.options) && value < this.options.length;
        },
        message: "correctIndex must be an integer within options range",
      },
    },
  },
  { collection: "quiz_questions" }
);

export default mongoose.models.QuizQuestion || mongoose.model("QuizQuestion", quizQuestionSchema);