// Business logic for assignments (UN-107 + UN-302). Plain functions, no Express objects.
// Rules come from ADR section 6: tasks can only be added, changed or removed BEFORE the
// period starts (6.2), and every dueAt must be unique and inside the period (6.4).
// UN-302: step completion and submission (student-only).
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { Assignment, Classroom, Pet, Submission } from "../models/index.js";
import { DEFAULT_ASSIGNMENT, STEP_LABELS } from "../config/game.js";

function isDuplicateKey(error) {
  return error && error.code === 11000;
}

// Shape sent to the client (ADR 7.5).
export function toAssignmentJson(assignment) {
  return {
    id: assignment._id.toString(),
    classroomId: assignment.classroomId.toString(),
    periodId: assignment.periodId.toString(),
    title: assignment.title,
    description: assignment.description,
    dueAt: assignment.dueAt,
    createdAt: assignment.createdAt,
  };
}

// The classroom a user belongs to: the one a teacher owns, or the one a student joined.
async function getClassroomOf(user) {
  if (user.role === "teacher") return Classroom.findOne({ teacherId: user._id });
  if (!user.classroomId) return null;
  return Classroom.findById(user.classroomId);
}

// ADR 6.2 (PERIOD_LOCKED): once the period has started nothing can be added, edited or removed.
function assertPeriodOpen(classroom) {
  if (Date.now() >= classroom.period.startDate.getTime()) {
    throw new AppError(409, "PERIOD_LOCKED", "The period already started; assignments can no longer change");
  }
}

// ADR 6.4: dueAt must fall inside [startDate, endDate].
function assertDueAtInPeriod(classroom, dueAt) {
  const { startDate, endDate } = classroom.period;
  if (dueAt < startDate || dueAt > endDate) {
    throw new AppError(400, "VALIDATION_ERROR", "dueAt must be inside the classroom period");
  }
}

function duplicateDueAt() {
  return new AppError(409, "CONFLICT", "Another assignment already has that dueAt");
}

// Finds an assignment and checks that the teacher owns its classroom.
// Missing -> 404, someone else's -> 403 (ADR 7.2).
async function getOwnedAssignment(assignmentId, teacher) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  const classroom = await Classroom.findById(assignment.classroomId);
  if (!classroom || !classroom.teacherId.equals(teacher._id)) {
    throw new AppError(403, "FORBIDDEN", "This assignment belongs to another teacher's classroom");
  }
  // An assignment of a past period is history and never changes (ADR 6.2).
  if (!assignment.periodId.equals(classroom.period.periodId)) {
    throw new AppError(409, "PERIOD_LOCKED", "This assignment belongs to a finished period");
  }
  return { assignment, classroom };
}

// GET /api/assignments: assignments of the current period, ordered by dueAt (ADR 7.3).
export async function listAssignments(user) {
  const classroom = await getClassroomOf(user);
  if (!classroom) throw new AppError(404, "NOT_FOUND", "You do not belong to a classroom yet");
  return Assignment.find({ classroomId: classroom._id, periodId: classroom.period.periodId }).sort({ dueAt: 1 });
}

// GET /api/assignments/:id: any member of the assignment's classroom (teacher or student).
export async function getAssignment(user, assignmentId) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  const classroom = await getClassroomOf(user);
  if (!classroom || !classroom._id.equals(assignment.classroomId)) {
    throw new AppError(403, "FORBIDDEN", "This assignment belongs to another classroom");
  }
  return assignment;
}

// POST /api/assignments: classroomId and periodId come from the teacher's classroom (ADR 7.4).
export async function createAssignment(teacher, input) {
  const classroom = await getClassroomOf(teacher);
  if (!classroom) throw new AppError(404, "NOT_FOUND", "Create a classroom before adding assignments");
  assertPeriodOpen(classroom);

  const dueAt = new Date(input.dueAt);
  assertDueAtInPeriod(classroom, dueAt);

  let assignment;
  try {
    assignment = await Assignment.create({
      classroomId: classroom._id,
      periodId: classroom.period.periodId,
      title: input.title,
      description: input.description,
      dueAt,
    });
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateDueAt(); // unique { classroomId, periodId, dueAt }
    throw error;
  }

  // Denormalized counter used by lifeLossPerTask = 100 / totalAssignments (ADR 8.2).
  await Classroom.updateOne({ _id: classroom._id }, { $inc: { "period.totalAssignments": 1 } });
  return assignment;
}

// PATCH /api/assignments/:id: only title, description and dueAt can change.
export async function updateAssignment(teacher, assignmentId, input) {
  const { assignment, classroom } = await getOwnedAssignment(assignmentId, teacher);
  assertPeriodOpen(classroom);

  if (input.title !== undefined) assignment.title = input.title;
  if (input.description !== undefined) assignment.description = input.description;
  if (input.dueAt !== undefined) {
    const dueAt = new Date(input.dueAt);
    assertDueAtInPeriod(classroom, dueAt);
    assignment.dueAt = dueAt;
  }

  try {
    await assignment.save();
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateDueAt();
    throw error;
  }
  return assignment;
}

// DELETE /api/assignments/:id. Before the period starts there are no submissions yet
// (they need an active task and a started period, ADR 6.5), so nothing is left orphaned.
export async function deleteAssignment(teacher, assignmentId) {
  const { assignment, classroom } = await getOwnedAssignment(assignmentId, teacher);
  assertPeriodOpen(classroom);

  const result = await Assignment.deleteOne({ _id: assignment._id });
  if (result.deletedCount === 1) {
    await Classroom.updateOne({ _id: classroom._id }, { $inc: { "period.totalAssignments": -1 } });
  }
  return { assignmentId: assignment._id.toString() };
}

// ---------------------------------------------------------------------------
// UN-302: Student step completion & submission
// ---------------------------------------------------------------------------

// Build the 4 steps with labels (same as client's ASSIGNMENT_STEP_LABELS)
function buildSteps(completedArray = [false, false, false, false]) {
  return STEP_LABELS.map((label, index) => ({ id: index + 1, label, completed: completedArray[index] }));
}

// Get the active assignment for a student with step progress (mirrors gameService.getCurrentAssignment)
async function getActiveAssignment(user) {
  const pet = await Pet.findOne({ ownerId: user._id });
  const classroom = user.classroomId ? await Classroom.findById(user.classroomId) : null;

  // If period started and student has classroom, find active assignment
  if (classroom && Date.now() >= classroom.period.startDate.getTime()) {
    const assignments = await Assignment.find({
      classroomId: classroom._id,
      periodId: classroom.period.periodId,
      dueAt: { $gt: new Date() },
    }).sort({ dueAt: 1 });

    const submitted = await Submission.find({
      studentId: user._id,
      assignmentId: { $in: assignments.map((a) => a._id) },
    }).select("assignmentId");
    const done = new Set(submitted.map((s) => s.assignmentId.toString()));
    const active = assignments.find((a) => !done.has(a._id.toString()));

    if (active) {
      // Get step progress from pet (or default to all false)
      const stepProgress = pet?.currentAssignmentSteps || [false, false, false, false];
      return {
        id: active._id.toString(),
        title: active.title,
        description: active.description,
        dueAt: active.dueAt,
        steps: buildSteps(stepProgress),
      };
    }
  }

  // Fallback: default assignment (no classroom, no active tasks, or period not started)
  // For default assignment, also check pet for step progress
  const stepProgress = pet?.currentAssignmentSteps || [false, false, false, false];
  return { ...DEFAULT_ASSIGNMENT, steps: buildSteps(stepProgress) };
}

// Get the student's pet (for hunger/health/status checks)
async function getStudentPet(user) {
  const pet = await Pet.findOne({ ownerId: user._id });
  if (!pet) throw new AppError(404, "NOT_FOUND", "You do not have a Pancho yet: join a classroom first");
  return pet;
}

// POST /api/assignments/:id/steps - complete step 1, 2 or 3
export async function completeStep(user, assignmentId, stepId) {
  // Only students can complete steps
  if (user.role !== "student") throw new AppError(403, "FORBIDDEN", "Only students can complete steps");

  const pet = await getStudentPet(user);
  if (pet.status === "DEAD") {
    throw new AppError(409, "CONFLICT", "Pancho can't work on assignments right now.");
  }

  const assignment = await getActiveAssignment(user);

  // Verify the assignment matches (or is the default)
  if (assignment.id !== assignmentId) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found or not active");
  }

  const step = assignment.steps.find((s) => s.id === stepId);
  if (!step) throw new AppError(404, "NOT_FOUND", "That step doesn't exist.");
  if (step.completed) throw new AppError(409, "CONFLICT", "This step is already completed.");

  // Update step progress in pet
  const stepProgress = [...(pet.currentAssignmentSteps || [false, false, false, false])];
  stepProgress[stepId - 1] = true;
  await Pet.updateOne({ _id: pet._id }, { $set: { currentAssignmentSteps: stepProgress } });

  const steps = assignment.steps.map((s) => (s.id === stepId ? { ...s, completed: true } : s));
  const updatedAssignment = { ...assignment, steps };

  return {
    success: true,
    step: { ...step, completed: true },
    state: { currentAssignment: updatedAssignment },
  };
}

// POST /api/assignments/:id/submit - submit assignment (step 4)
export async function submitAssignment(user, assignmentId) {
  // Only students can submit
  if (user.role !== "student") throw new AppError(403, "FORBIDDEN", "Only students can submit assignments");

  const pet = await getStudentPet(user);
  if (pet.status === "dead") {
    throw new AppError(409, "CONFLICT", "Pancho can't submit an assignment right now.");
  }

  // Check for existing submission on this specific assignment FIRST
  // (unique index on assignmentId + studentId will enforce this, but we check early to return 409 instead of 404)
  const existingSubmission = await Submission.findOne({
    assignmentId: new mongoose.Types.ObjectId(assignmentId),
    studentId: user._id,
  });
  if (existingSubmission) {
    throw new AppError(409, "CONFLICT", "You have already submitted this assignment.");
  }

  const assignment = await getActiveAssignment(user);

  // Verify the assignment matches
  if (assignment.id !== assignmentId) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found or not active");
  }

  // Check steps 1-3 are completed
  const prepStepsDone = assignment.steps.filter((s) => s.id !== 4).every((s) => s.completed);
  if (!prepStepsDone) {
    throw new AppError(409, "CONFLICT", "Complete steps 1-3 before submitting the assignment.");
  }

  // Create submission (unique index on assignmentId + studentId prevents duplicates)
  try {
    await Submission.create({
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
      studentId: user._id,
      fileName: "assignment_submission",
      fileUrl: "https://example.com/submission",
      storageKey: "submissions/" + assignmentId + "_" + user._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, "CONFLICT", "You have already submitted this assignment.");
    }
    throw error;
  }

  // Update pet hunger (+30, max 100) AND reset step progress
  const newHunger = Math.min(100, pet.hunger + 30);
  await Pet.updateOne(
    { _id: pet._id },
    { $set: { hunger: newHunger, currentAssignmentSteps: [false, false, false, false] } }
  );

  // Return updated state (client expects this shape)
  return {
    success: true,
    rewards: { hunger: 30 },
    state: {
      dog: { hunger: newHunger },
      student: { assignmentsCompleted: (await Submission.countDocuments({ studentId: user._id })) },
      currentAssignment: { ...DEFAULT_ASSIGNMENT, steps: buildSteps() },
    },
  };
}
