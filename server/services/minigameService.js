// UN-501 · Quiz calificado en servidor y tope diario (ADR 8.6 / 8.8).
// - GET /api/minigames/quiz: devuelve las 5 preguntas SIN correctIndex.
// - POST /api/minigames/quiz/submit: califica en el servidor, aplica recompensa y límites.
// Reemplaza el endpoint stop-gap POST /api/minigames/reward de UN-303.
//
// UN-XXX · Minigame assignments (teacher assigns, student views).
import AppError from "../utils/AppError.js";
import { MinigamePlay, Pet, QuizQuestion, MinigameAssignment, Classroom } from "../models/index.js";
import { MINIGAME_MAX_COINS_PER_PLAY, minigameLimits } from "../config/game.js";
import { clock } from "../utils/clock.js";
import * as gameService from "./gameService.js";

const EPSILON = 1e-9;

/**
 * Lista de minigames disponibles para asignar.
 * En el futuro esto podría venir de una colección o config.
 * Por ahora solo existe "quiz".
 */
export const AVAILABLE_MINIGAMES = [
  { id: "quiz", name: "Quick Quiz", description: "5 preguntas rápidas de cultura general" },
  // Futuro: { id: "memory", name: "Memory Match", description: "Encuentra las parejas" },
];

/**
 * Valida que un minigameId existe en el catálogo disponible.
 */
export function validateMinigameId(minigameId) {
  return AVAILABLE_MINIGAMES.some((m) => m.id === minigameId);
}

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

/**
 * Asigna un minijuego a un salón (solo profesores).
 * @param {Object} teacher - Usuario profesor autenticado
 * @param {string} classroomId - ID del salón
 * @param {string} minigameId - ID del minijuego (ej: "quiz")
 * @returns {Promise<Object>} La asignación creada
 */
export async function assignMinigame(teacher, classroomId, minigameId) {
  // 1. Validar minigameId
  if (!validateMinigameId(minigameId)) {
    throw new AppError(400, "BAD_REQUEST", `Minigame '${minigameId}' no está disponible`);
  }

  // 2. Verificar que el salón pertenece al profesor
  const classroom = await Classroom.findOne({ _id: classroomId, teacherId: teacher._id });
  if (!classroom) {
    throw new AppError(404, "NOT_FOUND", "Classroom not found or access denied");
  }

  // 3. Crear o actualizar la asignación (upsert por índice único)
  const assignment = await MinigameAssignment.findOneAndUpdate(
    { classroomId, minigameId },
    {
      $setOnInsert: {
        classroomId,
        minigameId,
        assignedBy: teacher._id,
        assignedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return assignment.toObject();
}

/**
 * Lista los minijuegos asignados a un salón (solo profesores).
 * @param {Object} teacher - Usuario profesor autenticado
 * @param {string} classroomId - ID del salón
 * @returns {Promise<Array>} Lista de asignaciones con info del minijuego
 */
export async function listAssignedMinigames(teacher, classroomId) {
  // Verificar que el salón pertenece al profesor
  const classroom = await Classroom.findOne({ _id: classroomId, teacherId: teacher._id });
  if (!classroom) {
    throw new AppError(404, "NOT_FOUND", "Classroom not found or access denied");
  }

  const assignments = await MinigameAssignment.find({ classroomId })
    .sort({ assignedAt: 1 })
    .lean();

  // Enriquecer con info del catálogo
  return assignments.map((a) => {
    const info = AVAILABLE_MINIGAMES.find((m) => m.id === a.minigameId);
    return {
      _id: a._id,
      minigameId: a.minigameId,
      name: info?.name ?? a.minigameId,
      description: info?.description ?? "",
      assignedAt: a.assignedAt,
    };
  });
}

/**
 * Elimina una asignación de minijuego (solo profesores).
 * @param {Object} teacher - Usuario profesor autenticado
 * @param {string} classroomId - ID del salón
 * @param {string} assignmentId - ID de la asignación (MinigameAssignment._id)
 */
export async function removeMinigameAssignment(teacher, classroomId, assignmentId) {
  // Verificar que el salón pertenece al profesor
  const classroom = await Classroom.findOne({ _id: classroomId, teacherId: teacher._id });
  if (!classroom) {
    throw new AppError(404, "NOT_FOUND", "Classroom not found or access denied");
  }

  const result = await MinigameAssignment.findOneAndDelete({
    _id: assignmentId,
    classroomId,
  });

  if (!result) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found");
  }
}

/**
 * Obtiene los minijuegos asignados al estudiante (para su salón actual).
 * @param {Object} student - Usuario estudiante autenticado
 * @returns {Promise<Array>} Lista de minijuegos asignados con info del catálogo
 */
export async function getStudentAssignedMinigames(student) {
  // 1. Obtener el classroomId del estudiante
  if (!student.classroomId) {
    return []; // Estudiante sin salón -> no hay minijuegos asignados
  }

  // 2. Buscar asignaciones para ese salón
  const assignments = await MinigameAssignment.find({ classroomId: student.classroomId })
    .sort({ assignedAt: 1 })
    .lean();

  // 3. Enriquecer con info del catálogo
  return assignments.map((a) => {
    const info = AVAILABLE_MINIGAMES.find((m) => m.id === a.minigameId);
    return {
      _id: a._id,
      minigameId: a.minigameId,
      name: info?.name ?? a.minigameId,
      description: info?.description ?? "",
      assignedAt: a.assignedAt,
    };
  });
}

/**
 * Obtiene las partidas de minijuegos de un salón (para profesores).
 * Muestra qué estudiantes han completado qué minijuegos.
 * @param {Object} teacher - Usuario profesor autenticado
 * @param {string} classroomId - ID del salón
 * @returns {Promise<Array>} Lista de partidas con info del estudiante y minijuego
 */
export async function getClassroomMinigamePlays(teacher, classroomId) {
  // Verificar que el salón pertenece al profesor
  const classroom = await Classroom.findOne({ _id: classroomId, teacherId: teacher._id });
  if (!classroom) {
    throw new AppError(404, "NOT_FOUND", "Classroom not found or access denied");
  }

  // Obtener estudiantes del salón
  const User = (await import("../models/index.js")).User;
  const students = await User.find({ classroomId, role: "student" }).select("name").lean();
  const studentMap = new Map(students.map((s) => [s._id.toString(), s.name]));

  // Obtener partidas de minijuegos de esos estudiantes
  const studentIds = students.map((s) => s._id);
  const plays = await MinigamePlay.find({ studentId: { $in: studentIds } })
    .sort({ playedAt: -1 })
    .lean();

  // Enriquecer con info del estudiante y catálogo
  return plays.map((play) => {
    const info = AVAILABLE_MINIGAMES.find((m) => m.id === play.gameId);
    return {
      _id: play._id,
      studentId: play.studentId,
      studentName: studentMap.get(play.studentId.toString()) || "Unknown",
      minigameId: play.gameId,
      minigameName: info?.name ?? play.gameId,
      reward: play.reward,
      playedAt: play.playedAt,
    };
  });
}