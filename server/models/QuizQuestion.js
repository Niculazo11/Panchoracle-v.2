import mongoose from "mongoose";

const { Schema } = mongoose;

// ADR 8.8 / UN-102. Los campos salen 1:1 de
// src/pages/minigames/quizQuestions.js (id, prompt, options, correctIndex).
// Este archivo SOLO define el modelo: el seed y la migración del frontend
// corresponden a UN-111.
const quizQuestionSchema = new Schema(
  {
    // Clave natural ("q1", "q2", ...): las respuestas del cliente la referencian.
    questionId: {
      type: String,
      required: [true, "questionId es obligatorio"],
      unique: true,
      trim: true,
      maxlength: 30,
    },
    prompt: { type: String, required: [true, "prompt es obligatorio"], trim: true, maxlength: 300 }, // longitud: decisión técnica
    options: {
      type: [{ type: String, trim: true, required: true, maxlength: 150 }], // longitud: decisión técnica
      validate: {
        // Decisión técnica: mínimo 2 opciones (hoy todas tienen 4).
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: "options debe tener al menos 2 opciones",
      },
    },
    correctIndex: {
      type: Number,
      required: [true, "correctIndex es obligatorio"],
      min: 0,
      validate: {
        validator(value) {
          return Number.isInteger(value) && Array.isArray(this.options) && value < this.options.length;
        },
        message: "correctIndex debe ser un entero dentro del rango de options",
      },
    },
  },
  { collection: "quiz_questions" }
);

export default mongoose.models.QuizQuestion || mongoose.model("QuizQuestion", quizQuestionSchema);