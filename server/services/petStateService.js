// UN-108 · Lazy hunger and health of a Pancho, calculated on the server (ADR 5.3 and 5.4).
//
// There is no setInterval and no cron (Vercel is serverless). The state is DERIVED from
// timestamps (assignment.createdAt / dueAt, submissions) every time a Pancho is read or changed,
// so a student who is away for days gets the same result as one who stayed connected.
//   - HUNGER is a countdown to the dueAt of the next pending assignment:
//       hunger = clamp(100 * (dueAt - now) / (dueAt - startTime), 0, 100)
//     It is 0 when the pending assignments are all overdue, and 100 when nothing is pending.
//     It is never stored as truth: every read recomputes it.
//   - HEALTH never decays with time and never changes when something is handed in. It only drops
//     by OVERDUE_HEALTH_PENALTY (10) ONCE per assignment that is overdue and not submitted. The
//     assignments already charged are kept in pet.penalizedAssignments, so repeated reads (or two
//     requests at the same time) can never charge the same assignment twice.
//   - health 0 -> "dead", and a dead Pancho never changes again (no revive exists, ADR 5.4).
//     A teacher can forgive points of a LIVING Pancho (healthRestoreService); the penalized
//     assignments stay recorded, so a forgiven task is never charged again.
import mongoose from "mongoose";
import { Assignment, Pet, Submission } from "../models/index.js";
import { clock } from "../utils/clock.js";

export const OVERDUE_HEALTH_PENALTY = 10;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
// Rounded to 9 decimals only to absorb floating point noise from old fractional health values.
const round = (value) => Math.round(value * 1e9) / 1e9;

// Hunger of a living Pancho. `pending` = assignments of the period the student has not submitted.
function hungerOf(pending, period, now) {
  const periodStart = period.startDate.getTime();
  if (now < periodStart) return 100; // the period has not started: nothing to be hungry for

  // Next deadline = the pending assignment with the earliest dueAt that is still in the future.
  const next = pending
    .filter((item) => item.dueAt.getTime() > now)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())[0];
  if (next) {
    const dueAt = next.dueAt.getTime();
    // Countdown starts when the assignment was created, but never before the period began (a task
    // prepared in advance must not make Pancho hungry before day one).
    const startTime = Math.max(next.createdAt ? next.createdAt.getTime() : 0, periodStart);
    const length = dueAt - startTime;
    return length <= 0 ? 100 : clamp(100 * ((dueAt - now) / length), 0, 100);
  }
  // Nothing is still open: pending assignments (if any) are all overdue -> 0; nothing pending -> 100.
  return pending.length > 0 ? 0 : 100;
}

// Pure function (no database): easy to test with a simulated clock.
//  pet:          { health, hunger, status } as stored
//  period:       { startDate, endDate } of the classroom
//  assignments:  [{ id, dueAt, createdAt }] of the period, any order
//  submittedIds: Set of assignment ids this student already submitted
//  penalizedIds: Set of assignment ids whose -10 was already charged
//  now:          milliseconds (server clock)
// Returns { health, hunger, status, newlyPenalized: [assignment ids charged by THIS call] }.
export function computePetState({ pet, period, assignments, submittedIds, penalizedIds = new Set(), now }) {
  // A dead Pancho stays exactly as it is for the rest of the period (ADR 5.4).
  if (pet.status === "dead") {
    return { health: pet.health, hunger: pet.hunger, status: "dead", newlyPenalized: [] };
  }

  const pending = assignments.filter((item) => !submittedIds.has(item.id));
  const newlyPenalized = pending
    .filter((item) => item.dueAt.getTime() <= now && !penalizedIds.has(item.id))
    .map((item) => item.id);

  const health = round(Math.max(0, pet.health - OVERDUE_HEALTH_PENALTY * newlyPenalized.length));
  if (health <= 0) return { health: 0, hunger: 0, status: "dead", newlyPenalized };

  return { health, hunger: hungerOf(pending, period, now), status: "alive", newlyPenalized };
}

// Reconciles several pets of ONE classroom with a single read of assignments and submissions.
// Returns the same pet documents with health, hunger and status updated in memory. Only the
// durable facts (health, status, penalizedAssignments) are written, and only when an assignment
// was just charged; hunger is a snapshot recalculated on every read, so a plain read never writes.
export async function reconcilePets(classroom, pets, now = clock.now()) {
  if (!classroom || pets.length === 0) return pets;

  const live = pets.filter(
    (pet) => pet.status === "alive" && pet.periodId.equals(classroom.period.periodId)
  );
  if (live.length === 0) return pets;

  const assignments = await Assignment.find({
    classroomId: classroom._id,
    periodId: classroom.period.periodId,
  }).select("dueAt createdAt");
  const items = assignments.map((item) => ({
    id: item._id.toString(),
    dueAt: item.dueAt,
    createdAt: item.createdAt,
  }));

  const submissions =
    items.length === 0
      ? []
      : await Submission.find({
          studentId: { $in: live.map((pet) => pet.ownerId) },
          assignmentId: { $in: assignments.map((item) => item._id) },
        }).select("studentId assignmentId");
  const submittedBy = new Map();
  for (const submission of submissions) {
    const key = submission.studentId.toString();
    if (!submittedBy.has(key)) submittedBy.set(key, new Set());
    submittedBy.get(key).add(submission.assignmentId.toString());
  }

  const writes = [];
  for (const pet of live) {
    const alreadyCharged = pet.penalizedAssignments ?? [];
    const healthBefore = pet.health;
    const next = computePetState({
      pet,
      period: classroom.period,
      assignments: items,
      submittedIds: submittedBy.get(pet.ownerId.toString()) ?? new Set(),
      penalizedIds: new Set(alreadyCharged.map((id) => id.toString())),
      now,
    });
    pet.health = next.health;
    pet.hunger = next.hunger;
    pet.status = next.status;
    if (next.newlyPenalized.length === 0) continue;

    const charged = next.newlyPenalized.map((id) => new mongoose.Types.ObjectId(id));
    pet.penalizedAssignments = [...alreadyCharged, ...charged]; // keep the in-memory copy in step
    writes.push({
      updateOne: {
        // status "alive": a Pancho that already died is never touched again.
        // penalizedAssignments $nin: if a parallel request already charged any of these tasks, this
        // write is skipped, so the same task can never cost health twice.
        // health: if a teacher restored points in the meantime, this write was computed from an
        // outdated health, so it is skipped (the next read recomputes).
        filter: {
          _id: pet._id,
          status: "alive",
          health: healthBefore,
          penalizedAssignments: { $nin: charged },
        },
        update: {
          $set: { status: next.status, hunger: next.hunger, health: next.health },
          $addToSet: { penalizedAssignments: { $each: charged } },
        },
      },
    });
  }
  if (writes.length > 0) await Pet.bulkWrite(writes, { ordered: false });
  return pets;
}

// Same, for the student's own Pancho (used before building the game state).
export async function reconcilePet(classroom, pet, now = clock.now()) {
  await reconcilePets(classroom, [pet], now);
  return pet;
}