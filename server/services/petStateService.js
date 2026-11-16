// UN-108 · Lazy hunger and health of a Pancho, calculated on the server (ADR 5.3 and 5.4).
//
// There is no setInterval and no cron (Vercel is serverless). The state is DERIVED from
// timestamps (period.startDate, assignment.dueAt, submissions) every time a Pancho is read
// or changed, so a student who is away for days gets the same result as one who stayed
// connected. The ADR (decision D4) replaced the prototype's "-2 hunger every 15 s" tick:
// that rule would kill Pancho after ~15 minutes offline. This file implements the ADR rules:
//   - hunger falls linearly while the active assignment approaches its dueAt;
//   - health only falls when an assignment expires without a submission, and a teacher can
//     forgive lost points of a LIVING Pancho (pet.healthAdjustment, ADR Rev. 2.3);
//   - health 0 -> "dead", and a dead Pancho never changes again (no revive exists).
import { Assignment, Pet, Submission } from "../models/index.js";
import { clock } from "../utils/clock.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Pure function (no database): easy to test with a simulated clock.
//  pet:         { health, hunger, status, healthAdjustment } as stored
//  period:      { startDate, endDate } of the classroom
//  assignments: [{ id, dueAt }] of the period, any order
//  submittedIds: Set of assignment ids this student already submitted
//  now:         milliseconds (server clock)
export function computePetState({ pet, period, assignments, submittedIds, now }) {
  // A dead Pancho stays exactly as it is for the rest of the period (ADR 5.4).
  if (pet.status === "dead") {
    return { health: pet.health, hunger: pet.hunger, status: "dead" };
  }

  const sorted = [...assignments].sort((a, b) => a.dueAt - b.dueAt);
  const total = sorted.length;
  const isDone = (item) => submittedIds.has(item.id);

  // Health. Multiply before dividing to avoid floating point drift (ADR 5.3). The teacher's
  // forgiven points (healthAdjustment) are ADDED to the base, so the automatic recalculation
  // never overwrites a restoration. The result is capped at 100 and rounded to 9 decimals only
  // to absorb floating point noise (e.g. 66.666...7 + 33.333...3 must be exactly 100).
  const missed = sorted.filter((item) => item.dueAt.getTime() <= now && !isDone(item)).length;
  const penalty = total === 0 ? 0 : (missed * 100) / total;
  const raw = clamp(100 - penalty + (pet.healthAdjustment ?? 0), 0, 100);
  const health = Math.round(raw * 1e9) / 1e9;
  const status = health <= 0 ? "dead" : "alive";

  // Hunger. Active assignment = first (by dueAt) not submitted, still in the future, and
  // the period already started. Its window starts at the previous dueAt (or the period start).
  let hunger = null;
  if (now >= period.startDate.getTime()) {
    for (let i = 0; i < total; i++) {
      const item = sorted[i];
      if (isDone(item) || item.dueAt.getTime() <= now) continue;
      const windowStart = (i === 0 ? period.startDate : sorted[i - 1].dueAt).getTime();
      const length = item.dueAt.getTime() - windowStart;
      hunger = length <= 0 ? 100 : clamp(((item.dueAt.getTime() - now) / length) * 100, 0, 100);
      break;
    }
  }
  if (hunger === null) {
    // No active assignment: 0 if the last assignment of the period was missed, else 100.
    const last = sorted[total - 1];
    hunger = last && last.dueAt.getTime() <= now && !isDone(last) ? 0 : 100;
  }

  return { health: status === "dead" ? 0 : health, hunger, status };
}

// Reconciles several pets of ONE classroom with a single read of assignments and submissions.
// Returns the same pet documents with health, hunger and status updated in memory. Only the
// durable facts (health, status) are written; hunger is a snapshot recalculated on every read
// (ADR 5.3), so reading never causes a write unless health or status really changed.
// health is derived from timestamps + healthAdjustment, so the stored value is only a cache.
export async function reconcilePets(classroom, pets, now = clock.now()) {
  if (!classroom || pets.length === 0) return pets;

  const live = pets.filter(
    (pet) => pet.status === "alive" && pet.periodId.equals(classroom.period.periodId)
  );
  if (live.length === 0) return pets;

  const assignments = await Assignment.find({
    classroomId: classroom._id,
    periodId: classroom.period.periodId,
  }).select("dueAt");
  const items = assignments.map((item) => ({ id: item._id.toString(), dueAt: item.dueAt }));

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
    const next = computePetState({
      pet,
      period: classroom.period,
      assignments: items,
      submittedIds: submittedBy.get(pet.ownerId.toString()) ?? new Set(),
      now,
    });
    const durableChange = next.health !== pet.health || next.status !== pet.status;
    pet.health = next.health;
    pet.hunger = next.hunger;
    pet.status = next.status;
    if (durableChange) {
      writes.push({
        updateOne: {
          // status "alive": a Pancho that already died is never touched again.
          // healthAdjustment: if a teacher restored points in the meantime, this write was
          // computed with an outdated adjustment, so it is skipped (the next read recomputes).
          filter: { _id: pet._id, status: "alive", healthAdjustment: pet.healthAdjustment ?? 0 },
          update: { $set: { status: next.status, hunger: next.hunger, health: next.health } },
        },
      });
    }
  }
  if (writes.length > 0) await Pet.bulkWrite(writes, { ordered: false });
  return pets;
}

// Same, for the student's own Pancho (used before building the game state).
export async function reconcilePet(classroom, pet, now = clock.now()) {
  await reconcilePets(classroom, [pet], now);
  return pet;
}
