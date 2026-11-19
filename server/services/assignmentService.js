// Business logic for assignments (UN-107 + UN-302). Plain functions, no Express objects.
// Rules come from ADR section 6. AMENDMENT (team decision, 2026-11-19): the teacher can add,
// edit and remove assignments at any time, not only before the period starts (6.2). What stays:
// every dueAt is unique and inside the period (6.4), and an assignment that is already due is
// history: its date cannot change and it cannot be removed, and no assignment can be given a
// due date in the past, so nobody is charged for a task that is created already missed.
// UN-302: step completion and submission (student-only).
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { Assignment, Classroom, Pet, Submission, SubmissionFile } from "../models/index.js";
import { loadStudentContext, rewardActiveSubmission, toGameJson } from "./gameService.js";

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

// A due date must still be ahead: a new or moved due date in the past would count as missed at once.
function assertDueAtInFuture(dueAt) {
  if (dueAt.getTime() <= Date.now()) {
    throw new AppError(400, "VALIDATION_ERROR", "dueAt must be in the future");
  }
}

// An assignment that is already due is history (its penalty may already be charged).
function assertNotDue(assignment, message) {
  if (assignment.dueAt.getTime() <= Date.now()) {
    throw new AppError(409, "ASSIGNMENT_EXPIRED", message);
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

  const dueAt = new Date(input.dueAt);
  assertDueAtInPeriod(classroom, dueAt);
  assertDueAtInFuture(dueAt);

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

  // Title and description can always change. The date only moves while the task is not due yet.
  if (input.title !== undefined) assignment.title = input.title;
  if (input.description !== undefined) assignment.description = input.description;
  if (input.dueAt !== undefined) {
    const dueAt = new Date(input.dueAt);
    if (dueAt.getTime() !== assignment.dueAt.getTime()) {
      assertNotDue(assignment, "This assignment is already due; its date can no longer change");
      assertDueAtInPeriod(classroom, dueAt);
      assertDueAtInFuture(dueAt);
      assignment.dueAt = dueAt;
    }
  }

  try {
    await assignment.save();
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateDueAt();
    throw error;
  }
  return assignment;
}

// DELETE /api/assignments/:id. Only while the task is not due yet: before that, a student may
// already have handed it in, so its submissions are removed with it (none is left orphaned).
export async function deleteAssignment(teacher, assignmentId) {
  const { assignment, classroom } = await getOwnedAssignment(assignmentId, teacher);
  assertNotDue(assignment, "This assignment is already due and can no longer be removed");

  // The stored bytes of handed-in files go too (collection submission_files).
  const handedIn = await Submission.find({ assignmentId: assignment._id }).select("_id");
  await SubmissionFile.deleteMany({ submissionId: { $in: handedIn.map((item) => item._id) } });
  await Submission.deleteMany({ assignmentId: assignment._id });
  const result = await Assignment.deleteOne({ _id: assignment._id });
  if (result.deletedCount === 1) {
    await Classroom.updateOne({ _id: classroom._id }, { $inc: { "period.totalAssignments": -1 } });
  }
  return { assignmentId: assignment._id.toString() };
}

// ---------------------------------------------------------------------------
// UN-302: Student step completion & submission
// The game state (steps, hunger, health) is built by gameService, the single place that
// reconciles Pancho with the server clock (UN-108), so every endpoint answers the same shape.
// ---------------------------------------------------------------------------

// POST /api/assignments/:id/steps - complete step 1, 2 or 3
export async function completeStep(user, assignmentId, stepId) {
  if (user.role !== "student") throw new AppError(403, "FORBIDDEN", "Only students can complete steps");

  const { pet, assignment } = await loadStudentContext(user);
  // status is stored in lowercase ("alive" | "dead"); the state is already reconciled, so a
  // Pancho that died by time since the last request is also detected here.
  if (pet.status === "dead") {
    throw new AppError(409, "CONFLICT", "Pancho can't work on assignments right now.");
  }
  if (assignment.id !== assignmentId) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found or not active");
  }

  const step = assignment.steps.find((item) => item.id === stepId);
  if (!step) throw new AppError(404, "NOT_FOUND", "That step doesn't exist.");
  if (step.completed) throw new AppError(409, "CONFLICT", "This step is already completed.");

  // One atomic update. Progress that belongs to another assignment is replaced, never reused.
  const index = stepId - 1;
  const filter = { _id: pet._id, status: "alive" };
  let update;
  if (pet.currentAssignmentStepsFor === assignment.id) {
    filter[`currentAssignmentSteps.${index}`] = false; // two clicks on the same step: only one wins
    update = { $set: { [`currentAssignmentSteps.${index}`]: true } };
  } else {
    filter.currentAssignmentStepsFor = { $ne: assignment.id };
    const steps = [false, false, false, false];
    steps[index] = true;
    update = { $set: { currentAssignmentSteps: steps, currentAssignmentStepsFor: assignment.id } };
  }
  const updated = await Pet.findOneAndUpdate(filter, update, { returnDocument: "after" });
  if (!updated) throw new AppError(409, "CONFLICT", "The step could not be saved (it changed at the same time). Try again.");

  return {
    success: true,
    step: { ...step, completed: true },
    state: await toGameJson(user, updated),
  };
}

// POST /api/assignments/:id/submit - submit assignment (step 4)
export async function submitAssignment(user, assignmentId) {
  if (user.role !== "student") throw new AppError(403, "FORBIDDEN", "Only students can submit assignments");

  const { pet, assignment } = await loadStudentContext(user);
  if (pet.status === "dead") {
    throw new AppError(409, "CONFLICT", "Pancho can't submit an assignment right now.");
  }

  // Check for an existing submission on this specific assignment FIRST (409, not 404).
  // The unique index (assignmentId, studentId) still enforces it under concurrency.
  const existingSubmission = await Submission.findOne({
    assignmentId: new mongoose.Types.ObjectId(assignmentId),
    studentId: user._id,
  });
  if (existingSubmission) {
    throw new AppError(409, "CONFLICT", "You have already submitted this assignment.");
  }

  if (assignment.id !== assignmentId) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found or not active");
  }

  const prepStepsDone = assignment.steps.filter((item) => item.id !== 4).every((item) => item.completed);
  if (!prepStepsDone) {
    throw new AppError(409, "CONFLICT", "Complete steps 1-3 before submitting the assignment.");
  }

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

  // ADR 5.5: submitting on time puts hunger at 100. (The old "+30 hunger" snapshot was thrown
  // away by the lazy calculation of UN-108, so the real hunger could look lower than promised.)
  // Steps are reset; with the submission saved, the next reconciliation also moves the
  // active assignment on and never counts this one as missed.
  const hungerBefore = pet.hunger;
  const updated = await rewardActiveSubmission(pet);

  return {
    success: true,
    rewards: { hunger: Math.max(0, Math.round(100 - hungerBefore)) }, // points of hunger recovered
    state: await toGameJson(user, updated),
  };
}
