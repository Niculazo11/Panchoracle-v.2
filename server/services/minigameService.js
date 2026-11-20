// UN-501 · Server-graded quiz and daily limit (ADR 8.6 / 8.8).
// - GET /api/minigames/quiz: returns 5 questions WITHOUT correctIndex.
// - POST /api/minigames/quiz/submit: grades on server, applies reward and limits.
// Replaces the stop-gap POST /api/minigames/reward endpoint from UN-303.
//
// UN-XXX · Minigame assignments (teacher assigns, student views).
import AppError from "../utils/AppError.js";
import { MinigamePlay, Pet, QuizQuestion, MinigameAssignment, Classroom } from "../models/index.js";
import { MINIGAME_MAX_COINS_PER_PLAY, minigameLimits } from "../config/game.js";
import { clock } from "../utils/clock.js";
import * as gameService from "./gameService.js";

const EPSILON = 1e-9;

/**
 * List of available minigames for assignment.
 * In the future this could come from a collection or config.
 * For now only "quiz" exists.
 */
export const AVAILABLE_MINIGAMES = [
  { id: "quiz", name: "Quick Quiz", description: "5 quick general knowledge questions" },
  // Future: { id: "memory", name: "Memory Match", description: "Find the pairs" },
];

/**
 * Validates that a minigameId exists in the available catalog.
 */
export function validateMinigameId(minigameId) {
  return AVAILABLE_MINIGAMES.some((m) => m.id === minigameId);
}

/**
 * Gets the 5 quiz questions without the correctIndex.
 * Questions come from the quiz_questions collection (UN-111 seed).
 * @returns {Promise<{ questions: Array<{ id, prompt, options }> }>}
 */
export async function getQuizQuestions() {
  const questions = await QuizQuestion.find().sort({ questionId: 1 }).select("-correctIndex -_id -__v").lean();
  if (questions.length !== 5) {
    // Fail-safe: if there are not 5 questions in DB, it's a configuration/seed error (UN-111).
    throw new AppError(500, "SERVER_ERROR", "Quiz not configured: expected 5 questions");
  }
  return { questions: questions.map((q) => ({ id: q.questionId, prompt: q.prompt, options: q.options })) };
}

/**
 * Grades quiz answers, applies reward and daily/cooldown limits.
 * @param {Object} user - Authenticated user (student)
 * @param {Array} answers - Array of 5 objects { questionId, selectedIndex }
 * @returns {Promise<{ reward, gameState, alreadyPlayedToday, playsToday, maxPlaysPerDay }>}
 */
export async function submitQuiz(user, answers) {
  // 1. Validate student has Pancho (created when joining classroom)
  const pet = await Pet.findOne({ ownerId: user._id });
  if (!pet) throw new AppError(404, "NOT_FOUND", "You do not have a Pancho yet: join a classroom first");

  // 2. Check limits: daily cap and cooldown (reuses minigameLimits from config/game.js)
  const { cooldownMs, maxPlaysPerDay } = minigameLimits();
  const now = clock.now();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const playsToday = await MinigamePlay.countDocuments({ studentId: user._id, playedAt: { $gte: dayStart } });
  if (playsToday >= maxPlaysPerDay) {
    throw new AppError(429, "RATE_LIMITED", "Daily minigame limit reached. Come back tomorrow.");
  }

  // 3. Get correct questions from DB (with correctIndex)
  const questions = await QuizQuestion.find().sort({ questionId: 1 }).select("questionId correctIndex").lean();
  if (questions.length !== 5) {
    throw new AppError(500, "SERVER_ERROR", "Quiz not configured: expected 5 questions");
  }

  // 4. Grade: map questionId -> correctIndex and compare
  const correctMap = new Map(questions.map((q) => [q.questionId, q.correctIndex]));
  let correctCount = 0;
  for (const answer of answers) {
    const correctIdx = correctMap.get(answer.questionId);
    if (correctIdx !== undefined && answer.selectedIndex === correctIdx) {
      correctCount++;
    }
    // If questionId doesn't exist in DB, counts as incorrect (no error, just 0 points)
  }

  // 5. Calculate reward: min(correct, 5) - ADR 8.6 / config constant
  const reward = Math.min(correctCount, MINIGAME_MAX_COINS_PER_PLAY);

  // 6. Atomic cooldown check: filter includes lastMinigameAt
  //    If no cooldown, updates coins and lastMinigameAt in a single operation.
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

  // 7. Record the play in minigame_plays (gameId = "quiz")
  await MinigamePlay.create({
    studentId: user._id,
    gameId: "quiz",
    reward,
    playedAt: new Date(now),
  });

  // 8. Return updated game state (same as toGameJson)
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
 * Assigns a minigame to a classroom (teachers only).
 * @param {Object} teacher - Authenticated teacher user
 * @param {string} classroomId - Classroom ID
 * @param {string} minigameId - Minigame ID (e.g., "quiz")
 * @returns {Promise<Object>} The created assignment
 */
export async function assignMinigame(teacher, classroomId, minigameId) {
  // 1. Validate minigameId
  if (!validateMinigameId(minigameId)) {
    throw new AppError(400, "BAD_REQUEST", `Minigame '${minigameId}' is not available`);
  }

  // 2. Verify classroom belongs to teacher
  const classroom = await Classroom.findOne({ _id: classroomId, teacherId: teacher._id });
  if (!classroom) {
    throw new AppError(404, "NOT_FOUND", "Classroom not found or access denied");
  }

  // 3. Create or update assignment (upsert by unique index)
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
 * Lists minigames assigned to a classroom (teachers only).
 * @param {Object} teacher - Authenticated teacher user
 * @param {string} classroomId - Classroom ID
 * @returns {Promise<Array>} List of assignments with minigame info
 */
export async function listAssignedMinigames(teacher, classroomId) {
  // Verify classroom belongs to teacher
  const classroom = await Classroom.findOne({ _id: classroomId, teacherId: teacher._id });
  if (!classroom) {
    throw new AppError(404, "NOT_FOUND", "Classroom not found or access denied");
  }

  const assignments = await MinigameAssignment.find({ classroomId })
    .sort({ assignedAt: 1 })
    .lean();

  // Enrich with catalog info
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
 * Removes a minigame assignment (teachers only).
 * @param {Object} teacher - Authenticated teacher user
 * @param {string} classroomId - Classroom ID
 * @param {string} assignmentId - Assignment ID (MinigameAssignment._id)
 */
export async function removeMinigameAssignment(teacher, classroomId, assignmentId) {
  // Verify classroom belongs to teacher
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
 * Gets minigames assigned to the student (for their current classroom).
 * @param {Object} student - Authenticated student user
 * @returns {Promise<Array>} List of assigned minigames with catalog info
 */
export async function getStudentAssignedMinigames(student) {
  // 1. Get student's classroomId
  if (!student.classroomId) {
    return []; // Student without classroom -> no assigned minigames
  }

  // 2. Find assignments for that classroom
  const assignments = await MinigameAssignment.find({ classroomId: student.classroomId })
    .sort({ assignedAt: 1 })
    .lean();

  // 3. Enrich with catalog info
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
 * Gets minigame plays for a classroom (for teachers).
 * Shows which students have completed which minigames.
 * @param {Object} teacher - Authenticated teacher user
 * @param {string} classroomId - Classroom ID
 * @returns {Promise<Array>} List of plays with student and minigame info
 */
export async function getClassroomMinigamePlays(teacher, classroomId) {
  // Verify classroom belongs to teacher
  const classroom = await Classroom.findOne({ _id: classroomId, teacherId: teacher._id });
  if (!classroom) {
    throw new AppError(404, "NOT_FOUND", "Classroom not found or access denied");
  }

  // Get students in classroom
  const User = (await import("../models/index.js")).User;
  const students = await User.find({ classroomId, role: "student" }).select("name").lean();
  const studentMap = new Map(students.map((s) => [s._id.toString(), s.name]));

  // Get minigame plays for those students
  const studentIds = students.map((s) => s._id);
  const plays = await MinigamePlay.find({ studentId: { $in: studentIds } })
    .sort({ playedAt: -1 })
    .lean();

  // Enrich with student and catalog info
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