// UN-501 · Quiz calificado en servidor y tope diario (ADR 8.6 / 8.8).
// - GET /api/minigames/quiz: devuelve las 5 preguntas SIN correctIndex.
// - POST /api/minigames/quiz/submit: califica en el servidor, aplica recompensa y límites.
// Reemplaza el endpoint stop-gap POST /api/minigames/reward de UN-303.
import AppError from "../utils/AppError.js";
import { MinigamePlay, Pet, QuizQuestion } from "../models/index.js";
import { MINIGAME_MAX_COINS_PER_PLAY, minigameLimits } from "../config/game.js";
import { clock } from "../utils/clock.js";
import * as gameService from "./gameService.js";

const EPSILON = 1e-9;

/**
 * Obtiene las 5 preguntas del quiz sin el correctIndex.
 * Las preguntas vienen de la colección quiz_questions (UN-111 seed).
 * @returns {Promise<{ questions: Array<{ id, prompt, options }> }>}
 */
export async function getQuizQuestions() {
  const questions = await QuizQuestion.find().sort({ questionId: 1 }).select("-correctIndex -_id -__v").lean();
  if (questions.length !== 5) {
    // Fail-safe: si no hay 5 preguntas en BD, es error de configuración/seed (UN-111).
    throw new AppError(500, "SERVER_ERROR", "Quiz not configured: expected 5 questions");
  }
  return { questions: questions.map((q) => ({ id: q.questionId, prompt: q.prompt, options: q.options })) };
}

/**
 * Califica las respuestas del quiz, aplica recompensa y límites diarios/enfriamiento.
 * @param {Object} user - Usuario autenticado (estudiante)
 * @param {Array} answers - Array de 5 objetos { questionId, selectedIndex }
 * @returns {Promise<{ reward, gameState, alreadyPlayedToday, playsToday, maxPlaysPerDay }>}
 */
export async function submitQuiz(user, answers) {
  // 1. Validar que el estudiante tiene Pancho (creado al unirse a salón)
  const pet = await Pet.findOne({ ownerId: user._id });
  if (!pet) throw new AppError(404, "NOT_FOUND", "You do not have a Pancho yet: join a classroom first");

  // 2. Verificar límites: tope diario y enfriamiento (reutiliza minigameLimits de config/game.js)
  const { cooldownMs, maxPlaysPerDay } = minigameLimits();
  const now = clock.now();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const playsToday = await MinigamePlay.countDocuments({ studentId: user._id, playedAt: { $gte: dayStart } });
  if (playsToday >= maxPlaysPerDay) {
    throw new AppError(429, "RATE_LIMITED", "Daily minigame limit reached. Come back tomorrow.");
  }

  // 3. Obtener las preguntas correctas de la BD (con correctIndex)
  const questions = await QuizQuestion.find().sort({ questionId: 1 }).select("questionId correctIndex").lean();
  if (questions.length !== 5) {
    throw new AppError(500, "SERVER_ERROR", "Quiz not configured: expected 5 questions");
  }

  // 4. Calificar: mapear questionId -> correctIndex y comparar
  const correctMap = new Map(questions.map((q) => [q.questionId, q.correctIndex]));
  let correctCount = 0;
  for (const answer of answers) {
    const correctIdx = correctMap.get(answer.questionId);
    if (correctIdx !== undefined && answer.selectedIndex === correctIdx) {
      correctCount++;
    }
    // Si questionId no existe en BD, cuenta como incorrecto (no lanza error, solo 0 puntos)
  }

  // 5. Calcular recompensa: min(aciertos, 5) - ADR 8.6 / constante de config
  const reward = Math.min(correctCount, MINIGAME_MAX_COINS_PER_PLAY);

  // 6. Verificar enfriamiento atómico: el filtro incluye lastMinigameAt
  //    Si no hay enfriamiento, actualiza coins y lastMinigameAt en una sola operación.
  const updatedPet = await Pet.findOneAndUpdate(
    {
      ownerId: user._id,
      $or: [{ lastMinigameAt: null }, { lastMinigameAt: { $lte: new Date(now - cooldownMs) } }],
    },
    { $inc: { coins: reward }, $set: { lastMinigameAt: new Date(now) } },
    { returnDocument: "after" }
  );

  if (!updatedPet) {
    throw new AppError(429, "RATE_LIMITED", "Wait a moment before playing again.");
  }

  // 7. Registrar la partida en minigame_plays (gameId = "quiz")
  await MinigamePlay.create({
    studentId: user._id,
    gameId: "quiz",
    reward,
    playedAt: new Date(now),
  });

  // 8. Devolver estado del juego actualizado (igual que toGameJson)
  const gameState = await gameService.toGameJson(user, updatedPet);

  return {
    reward,
    correctCount,
    gameState,
    alreadyPlayedToday: playsToday + 1,
    playsToday: playsToday + 1,
    maxPlaysPerDay,
  };
}