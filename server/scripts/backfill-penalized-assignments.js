// One-off migration for the -10 overdue penalty (run ONCE, right after deploying the new
// petStateService, before students open the app).
//
// Why: before this change, health was derived from "missed tasks". Pets saved in MongoDB have no
// penalizedAssignments, so without this script the first read would charge -10 again for every
// task that was already overdue. This marks those tasks as already charged and leaves health,
// hunger and status exactly as they are stored.
//
// Usage: MONGODB_URI="..." node server/scripts/backfill-penalized-assignments.js
import mongoose from "mongoose";
import { Assignment, Classroom, Pet, Submission } from "../models/index.js";

if (!process.env.MONGODB_URI) {
  console.error("Set MONGODB_URI first.");
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI);

const now = new Date();
let updatedPets = 0;

for (const classroom of await Classroom.find()) {
  const overdue = await Assignment.find({
    classroomId: classroom._id,
    periodId: classroom.period.periodId,
    dueAt: { $lte: now },
  }).select("_id");
  if (overdue.length === 0) continue;

  const pets = await Pet.find({ periodId: classroom.period.periodId, status: "alive" }).select("ownerId");
  for (const pet of pets) {
    const submitted = await Submission.find({
      studentId: pet.ownerId,
      assignmentId: { $in: overdue.map((item) => item._id) },
    }).select("assignmentId");
    const done = new Set(submitted.map((item) => item.assignmentId.toString()));
    const missed = overdue.map((item) => item._id).filter((id) => !done.has(id.toString()));
    if (missed.length === 0) continue;
    await Pet.updateOne({ _id: pet._id }, { $addToSet: { penalizedAssignments: { $each: missed } } });
    updatedPets++;
  }
}

console.log(`Done: ${updatedPets} pet(s) updated.`);
await mongoose.disconnect();