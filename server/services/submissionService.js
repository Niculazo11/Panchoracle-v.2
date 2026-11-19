// Business logic for handed-in work (docs/submissions-api.md). Plain functions, no Express objects.
//   - a student hands in ANY open assignment, in any order (replaces the "only the active one"
//     rule of the 4-step flow for this route only);
//   - a teacher reads what was handed in for the assignments of their classroom;
//   - the stored bytes of a file are served to the owner student and to the classroom's teacher.
import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { clock } from "../utils/clock.js";
import { MAX_FILE_BYTES } from "../config/submissions.js";
import { Assignment, Classroom, Submission, SubmissionFile, User } from "../models/index.js";
import { getCurrentAssignment, loadReconciledPet, rewardActiveSubmission } from "./gameService.js";

function isDuplicateKey(error) {
  return error && error.code === 11000;
}

const FILE_ROUTE = (submissionId) => `/api/submissions/${submissionId}/file`;

// Shape for the student (docs/submissions-api.md): GET /api/me/submissions and the 201 of the POST.
export function toSubmissionJson(submission) {
  return {
    id: submission._id.toString(),
    assignmentId: submission.assignmentId.toString(),
    kind: submission.kind,
    fileName: submission.fileName,
    fileUrl: submission.fileUrl,
    submittedAt: submission.submittedAt,
  };
}

// Shape for the teacher: the same plus the student who sent it.
export function toTeacherSubmissionJson(submission, student) {
  const { id, assignmentId, kind, fileName, fileUrl, submittedAt } = toSubmissionJson(submission);
  return {
    id,
    assignmentId,
    student: { id: submission.studentId.toString(), name: student?.name ?? "Former student" },
    kind,
    fileName,
    fileUrl,
    submittedAt,
  };
}

// ---------------------------------------------------------------------------
// Real file type. The type the client sends is never trusted: the first bytes must match it
// (magic numbers), so a script renamed to "photo.jpg" is rejected.
// ---------------------------------------------------------------------------
const startsWith = (bytes, signature, offset = 0) => signature.every((value, index) => bytes[offset + index] === value);

function detectMimeType(bytes) {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // WebP: "RIFF" + 4 bytes of size + "WEBP"
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // "%PDF-"
  return null;
}

// Decodes and checks the bytes of a file: size <= 3 MB and real type equal to the declared one.
function decodeFile({ mimeType, dataBase64 }) {
  const data = Buffer.from(dataBase64, "base64");
  if (data.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "The file is empty");
  }
  if (data.length > MAX_FILE_BYTES) {
    throw new AppError(400, "VALIDATION_ERROR", "The file is too big. The limit is 3 MB.");
  }
  if (detectMimeType(data) !== mimeType) {
    throw new AppError(400, "VALIDATION_ERROR", "The content of the file does not match its type");
  }
  return data;
}

// ---------------------------------------------------------------------------
// POST /api/assignments/:id/submissions (student)
// ---------------------------------------------------------------------------
export async function handInAssignment(user, assignmentId, input) {
  if (user.role !== "student") throw new AppError(403, "FORBIDDEN", "Only students can hand in assignments");

  // Rule 1: a dead Pancho cannot hand in (same answer as UN-302).
  const { pet, classroom } = await loadReconciledPet(user);
  if (pet.status === "dead") {
    throw new AppError(409, "CONFLICT", "Pancho can't submit an assignment right now.");
  }

  // Rule 2: the assignment belongs to the student's classroom and current period.
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  if (!classroom || !classroom._id.equals(assignment.classroomId)) {
    throw new AppError(403, "FORBIDDEN", "This assignment belongs to another classroom");
  }
  if (!assignment.periodId.equals(classroom.period.periodId)) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found in the current period");
  }

  // Rule 3: the period has started and the assignment is not due yet (ADR 5.5: no late submissions).
  const now = clock.now();
  if (now < classroom.period.startDate.getTime()) {
    throw new AppError(409, "CONFLICT", "The classroom period has not started yet");
  }
  if (now >= assignment.dueAt.getTime()) {
    throw new AppError(409, "ASSIGNMENT_EXPIRED", "This assignment is already due and no longer accepts submissions");
  }

  // Rule 4: one submission per assignment and student. Checked first for a clear 409; the unique
  // index { assignmentId, studentId } still decides when two requests arrive together.
  const duplicate = () => new AppError(409, "CONFLICT", "You have already submitted this assignment.");
  if (await Submission.exists({ assignmentId: assignment._id, studentId: user._id })) throw duplicate();

  // Bytes are checked before anything is written.
  const data = input.kind === "file" ? decodeFile(input) : null;

  // Rule 5 needs to know if this is the active assignment BEFORE the submission exists
  // (afterwards the active one moves on).
  const active = await getCurrentAssignment(user, classroom, pet);
  const wasActive = active.id === assignment._id.toString();

  const _id = new mongoose.Types.ObjectId();
  const fields =
    input.kind === "link"
      ? { kind: "link", fileName: new URL(input.url).hostname, fileUrl: input.url, storageKey: "" }
      : { kind: "file", fileName: input.fileName, fileUrl: FILE_ROUTE(_id), storageKey: `submission_files/${_id}` };

  let submission;
  try {
    submission = await Submission.create({
      _id,
      assignmentId: assignment._id,
      studentId: user._id,
      submittedAt: new Date(now),
      ...fields,
    });
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicate();
    throw error;
  }

  if (data) {
    try {
      await SubmissionFile.create({ submissionId: _id, mimeType: input.mimeType, size: data.length, data });
    } catch (error) {
      // Never leave a submission without its file.
      await Submission.deleteOne({ _id });
      throw error;
    }
  }

  // Rule 5: handing in the active assignment feeds Pancho like the 4-step flow does.
  if (wasActive) await rewardActiveSubmission(pet);

  return submission;
}

// ---------------------------------------------------------------------------
// GET /api/me/submissions (student)
// ---------------------------------------------------------------------------
export async function listMySubmissions(user) {
  if (user.role !== "student") throw new AppError(403, "FORBIDDEN", "Only students have their own submissions");
  return Submission.find({ studentId: user._id }).sort({ submittedAt: 1 });
}

// ---------------------------------------------------------------------------
// GET /api/assignments/:id/submissions (teacher who owns the classroom)
// Missing -> 404, someone else's -> 403 (ADR 7.2). Finished periods stay readable: it is history.
// ---------------------------------------------------------------------------
export async function listAssignmentSubmissions(teacher, assignmentId) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  const classroom = await Classroom.findById(assignment.classroomId);
  if (!classroom || !classroom.teacherId.equals(teacher._id)) {
    throw new AppError(403, "FORBIDDEN", "This assignment belongs to another teacher's classroom");
  }

  const submissions = await Submission.find({ assignmentId: assignment._id }).sort({ submittedAt: 1 });
  const students = await User.find({ _id: { $in: submissions.map((item) => item.studentId) } }).select("name");
  const byId = new Map(students.map((student) => [student._id.toString(), student]));
  return submissions.map((item) => toTeacherSubmissionJson(item, byId.get(item.studentId.toString())));
}

// ---------------------------------------------------------------------------
// GET /api/submissions/:id/file (owner student, or teacher of the classroom)
// ---------------------------------------------------------------------------
export async function getSubmissionFile(user, submissionId) {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new AppError(404, "NOT_FOUND", "Submission not found");

  if (user.role === "student") {
    if (!submission.studentId.equals(user._id)) {
      throw new AppError(403, "FORBIDDEN", "This submission belongs to another student");
    }
  } else {
    const assignment = await Assignment.findById(submission.assignmentId).select("classroomId");
    const classroom = assignment ? await Classroom.findById(assignment.classroomId).select("teacherId") : null;
    if (!classroom || !classroom.teacherId.equals(user._id)) {
      throw new AppError(403, "FORBIDDEN", "This submission belongs to another teacher's classroom");
    }
  }

  // A link has no stored file.
  const file = submission.kind === "file" ? await SubmissionFile.findOne({ submissionId: submission._id }) : null;
  if (!file) throw new AppError(404, "NOT_FOUND", "This submission has no stored file");

  return { fileName: submission.fileName, mimeType: file.mimeType, data: Buffer.from(file.data) };
}
