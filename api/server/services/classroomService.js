// Business logic for classrooms (UN-106). Plain functions, no Express objects.
import AppError from "../utils/AppError.js";
import { generateJoinCode, normalizeJoinCode } from "../utils/joinCode.js";
import { Classroom, User, Pet } from "../models/index.js";

// ADR section 12 leaves the starting coins undefined; 270 is the prototype value.
const INITIAL_COINS = 270;
const MAX_CODE_ATTEMPTS = 5;

function isDuplicateKey(error) {
  return error && error.code === 11000;
}

// Shape sent to the client (ADR 7.5).
export function toClassroomJson(classroom) {
  return {
    id: classroom._id.toString(),
    name: classroom.name,
    teacherId: classroom.teacherId.toString(),
    joinCode: classroom.joinCode,
    period: {
      periodId: classroom.period.periodId.toString(),
      startDate: classroom.period.startDate,
      endDate: classroom.period.endDate,
      totalAssignments: classroom.period.totalAssignments,
    },
    createdAt: classroom.createdAt,
  };
}

// Finds a classroom and checks that the teacher owns it.
// Missing -> 404, someone else's -> 403 (ADR 7.2).
async function getOwnedClassroom(classroomId, teacher) {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) throw new AppError(404, "NOT_FOUND", "Classroom not found");
  if (!classroom.teacherId.equals(teacher._id)) {
    throw new AppError(403, "FORBIDDEN", "This classroom belongs to another teacher");
  }
  return classroom;
}

export async function createClassroom(teacher, input) {
  // One classroom per teacher (ADR 5.6, unique index on teacherId).
  const existing = await Classroom.exists({ teacherId: teacher._id });
  if (existing) throw new AppError(409, "CONFLICT", "You already have a classroom");

  const period = {
    startDate: new Date(input.period.startDate),
    endDate: new Date(input.period.endDate),
  };

  // A custom code is tried once. A generated code is retried if it happens to collide.
  const isCustom = Boolean(input.joinCode);
  let classroom = null;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && !classroom; attempt++) {
    const joinCode = isCustom ? input.joinCode : generateJoinCode();
    try {
      classroom = await Classroom.create({
        name: input.name,
        teacherId: teacher._id,
        joinCode,
        period,
      });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      if (error.keyPattern && error.keyPattern.teacherId) {
        throw new AppError(409, "CONFLICT", "You already have a classroom");
      }
      if (isCustom) throw new AppError(409, "CONFLICT", "That join code is already in use");
      // generated code collided: loop and try another one
    }
  }
  if (!classroom) throw new AppError(500, "INTERNAL_ERROR", "Could not generate a unique join code");

  // The teacher "belongs" to their classroom too, so GET /api/me stays consistent.
  await User.updateOne({ _id: teacher._id }, { classroomId: classroom._id });
  return classroom;
}

// A teacher gets the classroom they own (0 or 1 today); a student gets the one they joined.
export async function listClassrooms(user) {
  if (user.role === "teacher") {
    return Classroom.find({ teacherId: user._id });
  }
  if (!user.classroomId) return [];
  const classroom = await Classroom.findById(user.classroomId);
  return classroom ? [classroom] : [];
}

export async function renameClassroom(teacher, classroomId, name) {
  const classroom = await getOwnedClassroom(classroomId, teacher);
  classroom.name = name;
  await classroom.save();
  return classroom;
}

// DELETE POLICY (documented in docs/classrooms-api.md):
//  - every enrolled student is unenrolled (users.classroomId = null);
//  - pets are NOT deleted, they stay as they are;
//  - assignments and submissions are NOT deleted (left orphaned);
//  - the classroom document is removed last, so a failed call can simply be retried.
export async function deleteClassroom(teacher, classroomId) {
  const classroom = await getOwnedClassroom(classroomId, teacher);

  const result = await User.updateMany(
    { classroomId: classroom._id, role: "student" },
    { classroomId: null }
  );
  await User.updateOne({ _id: teacher._id }, { classroomId: null });
  await Classroom.deleteOne({ _id: classroom._id });

  return { classroomId: classroom._id.toString(), unenrolledStudents: result.modifiedCount };
}

// Joining with the same code twice never duplicates anything (idempotent).
export async function joinClassroom(student, rawCode) {
  const joinCode = normalizeJoinCode(rawCode);
  const classroom = await Classroom.findOne({ joinCode });
  if (!classroom) throw new AppError(404, "NOT_FOUND", "No classroom matches that join code");

  // Atomic guard: only enroll a student who has no classroom yet.
  const enrolled = await User.findOneAndUpdate(
    { _id: student._id, classroomId: null },
    { classroomId: classroom._id }
  );

  let alreadyJoined = false;
  if (!enrolled) {
    const current = await User.findById(student._id);
    if (!current || !current.classroomId || !current.classroomId.equals(classroom._id)) {
      throw new AppError(409, "CONFLICT", "You already belong to a classroom");
    }
    alreadyJoined = true;
  }

  // Also runs on a repeated join, so a join that failed halfway is repaired by retrying.
  await ensurePet(student._id, classroom.period.periodId);
  return { classroom, alreadyJoined };
}

// One pet per student (unique ownerId). A pet is created on the first join. A pet from
// another period starts a new cycle; a pet already in this period is left untouched,
// so leaving and rejoining can never revive a dead Pancho (ADR 5.4).
async function ensurePet(ownerId, periodId) {
  try {
    await Pet.updateOne(
      { ownerId },
      {
        $setOnInsert: {
          periodId,
          name: "Pancho",
          health: 100,
          hunger: 100,
          coins: INITIAL_COINS,
          status: "alive",
        },
      },
      { upsert: true }
    );
  } catch (error) {
    // two joins at the same moment: the other one created the pet, nothing to do
    if (!isDuplicateKey(error)) throw error;
  }

  await Pet.updateOne(
    { ownerId, periodId: { $ne: periodId } },
    { $set: { periodId, health: 100, hunger: 100, status: "alive" } }
  );
}

// Students of a classroom with a summary of their Pancho.
// health/hunger are the stored snapshot, not the value reconciled at request time (ADR 5.3).
export async function listStudents(teacher, classroomId) {
  const classroom = await getOwnedClassroom(classroomId, teacher);

  const users = await User.find({ classroomId: classroom._id, role: "student" })
    .select("name email")
    .sort({ name: 1 });

  const ownerIds = [];
  for (let i = 0; i < users.length; i++) ownerIds.push(users[i]._id);
  const pets = await Pet.find({ ownerId: { $in: ownerIds } });

  const petsByOwner = {};
  for (let i = 0; i < pets.length; i++) petsByOwner[pets[i].ownerId.toString()] = pets[i];

  const students = [];
  for (let i = 0; i < users.length; i++) {
    const pet = petsByOwner[users[i]._id.toString()];
    students.push({
      id: users[i]._id.toString(),
      name: users[i].name,
      email: users[i].email,
      pet: pet ? { status: pet.status, health: pet.health, hunger: pet.hunger } : null,
    });
  }
  return students;
}

// Unenrolls one student. Their pet is kept (same policy as deleting a classroom).
export async function removeStudent(teacher, classroomId, studentId) {
  const classroom = await getOwnedClassroom(classroomId, teacher);

  const result = await User.updateOne(
    { _id: studentId, classroomId: classroom._id, role: "student" },
    { classroomId: null }
  );
  if (result.matchedCount === 0) {
    throw new AppError(404, "NOT_FOUND", "That student is not in this classroom");
  }
}
