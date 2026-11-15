// Business logic for assignments (UN-107). Plain functions, no Express objects.
// Rules come from ADR section 6: tasks can only be added, changed or removed BEFORE the
// period starts (6.2), and every dueAt must be unique and inside the period (6.4).
import AppError from "../utils/AppError.js";
import { Assignment, Classroom } from "../models/index.js";

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
