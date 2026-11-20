// Business logic for assignments (UN-107). Plain functions, no Express objects.
// Rules come from ADR section 6. AMENDMENT (team decision, 2026-11-19): the teacher can add,
// edit and remove assignments at any time, not only before the period starts (6.2). What stays:
// every dueAt is unique and inside the period (6.4), and an assignment that is already due is
// history: its date cannot change and it cannot be removed, and no assignment can be given a
// due date in the past, so nobody is charged for a task that is created already missed.
// Students hand in their work through submissionService (a link or a file); the old 4-step
// checklist (POST /:id/steps and POST /:id/submit) was removed.
import AppError from "../utils/AppError.js";
import { Assignment, Classroom, Submission, SubmissionFile } from "../models/index.js";

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

  // Denormalized counter of the period's assignments (ADR 8.2).
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