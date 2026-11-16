// UN-108 [ADR Rev. 2.3] · The teacher forgives lost health of a LIVING Pancho
// (e.g. a student was sick and missed an assignment). This is NOT reviving (D5):
//   - a dead Pancho can never be restored: it stays dead until the next period;
//   - health can never go above 100;
//   - the forgiven points are stored in pet.healthAdjustment, which the automatic
//     reconciliation ADDS to the base calculation, so it never overwrites the restoration.
import AppError from "../utils/AppError.js";
import { Pet, User } from "../models/index.js";
import { clock } from "../utils/clock.js";
import { getOwnedClassroom } from "./classroomService.js";
import { reconcilePet } from "./petStateService.js";

const EPSILON = 1e-9;
const round = (value) => Math.round(value * 1e9) / 1e9;

export async function restoreHealth(teacher, classroomId, studentId, { points, reason }) {
  const classroom = await getOwnedClassroom(classroomId, teacher); // 404 / 403

  const student = await User.findOne({ _id: studentId, classroomId: classroom._id, role: "student" }).select("name");
  if (!student) throw new AppError(404, "NOT_FOUND", "That student is not in this classroom");

  const pet = await Pet.findOne({ ownerId: student._id });
  if (!pet) throw new AppError(404, "NOT_FOUND", "That student does not have a Pancho yet");
  if (!pet.periodId.equals(classroom.period.periodId)) {
    throw new AppError(409, "PERIOD_LOCKED", "That Pancho belongs to a finished period");
  }

  // Bring the Pancho up to date first: it may have died since the last read (and a dead
  // Pancho is never restored), and the points lost must be the current ones.
  const now = clock.now();
  await reconcilePet(classroom, pet, now);
  if (pet.status === "dead" || pet.health <= 0) {
    throw new AppError(409, "CONFLICT", "A dead Pancho cannot be restored; it stays dead until the next period");
  }

  const lost = round(100 - pet.health);
  if (lost <= EPSILON) throw new AppError(409, "CONFLICT", "Pancho has no lost health to restore");

  const amount = points ?? lost; // no points = give back everything that was lost
  if (amount > lost + EPSILON) {
    throw new AppError(409, "CONFLICT", `Only ${lost} points can be restored (health cannot go above 100)`);
  }
  const restored = round(Math.min(amount, lost));
  const healthAfter = Math.min(100, round(pet.health + restored));

  // One atomic update. The filter holds the preconditions (still alive, adjustment unchanged),
  // so two simultaneous restorations cannot both be applied on top of the same state.
  const updated = await Pet.findOneAndUpdate(
    { _id: pet._id, status: "alive", healthAdjustment: pet.healthAdjustment ?? 0 },
    {
      $inc: { healthAdjustment: restored },
      $set: { health: healthAfter },
      $push: {
        healthRestoreLog: {
          $each: [{ at: new Date(now), teacherId: teacher._id, points: restored, healthBefore: pet.health, healthAfter, reason }],
          $slice: -50,
        },
      },
    },
    { returnDocument: "after" }
  );
  if (!updated) throw new AppError(409, "CONFLICT", "Pancho changed while restoring; try again");

  return {
    restored,
    student: { id: student._id.toString(), name: student.name },
    pet: { status: updated.status, health: healthAfter, hunger: pet.hunger, healthAdjustment: updated.healthAdjustment },
  };
}
