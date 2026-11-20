// UN-107 · Integration tests for assignments API (/api/assignments)
// Run with: node --test server/tests/assignments.test.js   (uses node:test + mongodb-memory-server)

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom, Assignment, Pet, Submission } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");

let mongod;
let server;
let teacher, otherTeacher, student, outsider, classroom;

const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString().replace(/\.\d{3}Z$/, ".000Z");
const cookieOf = (user) => [`session=${signToken({ sub: user._id.toString() })}`];

const as = (user, method, path) => {
  const req = request(server)[method](`/api/assignments${path}`);
  return user ? req.set("Cookie", cookieOf(user)) : req;
};

async function makeUser(name, role, classroomId = null) {
  return User.create({ name, email: `${name}@test.com`, passwordHash: "x".repeat(60), role, classroomId });
}

// Classroom whose period starts in `startOffset` days and lasts 60 days.
async function makeClassroom(owner, startOffset, joinCode) {
  const created = await Classroom.create({
    name: "Salón",
    teacherId: owner._id,
    joinCode,
    period: { startDate: new Date(Date.now() + startOffset * DAY), endDate: new Date(Date.now() + (startOffset + 60) * DAY) },
  });
  await User.updateOne({ _id: owner._id }, { classroomId: created._id });
  return created;
}

before(async () => {
  mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  await Assignment.syncIndexes();
  server = app.listen(0);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  server.close();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Classroom.deleteMany({}), Assignment.deleteMany({})]);
  teacher = await makeUser("profe", "teacher");
  otherTeacher = await makeUser("profe2", "teacher");
  classroom = await makeClassroom(teacher, 10, "ABC234"); // period not started yet
  await makeClassroom(otherTeacher, 10, "XYZ789");
  student = await makeUser("ana", "student", classroom._id);
  outsider = await makeUser("beto", "student");
});

describe("UN-107 · POST /api/assignments", () => {
  it("teacher creates an assignment and period counter increments", async () => {
    const res = await as(teacher, "post", "/").send({ title: "Workshop 1", description: "Exercises 1-5", dueAt: iso(20) }).expect(201);
    assert.equal(res.body.assignment.title, "Workshop 1");
    assert.equal(res.body.assignment.classroomId, classroom._id.toString());
    assert.equal(res.body.assignment.periodId, classroom.period.periodId.toString());
    assert.equal((await Classroom.findById(classroom._id)).period.totalAssignments, 1);
  });

  it("student gets 403; no session gets 401", async () => {
    await as(student, "post", "/").send({ title: "X", dueAt: iso(20) }).expect(403);
    await as(null, "post", "/").send({ title: "X", dueAt: iso(20) }).expect(401);
  });

  it("validates dates: format, outside period; allows duplicate dates", async () => {
    await as(teacher, "post", "/").send({ title: "X", dueAt: "mañana" }).expect(400);
    await as(teacher, "post", "/").send({ title: "X", dueAt: iso(5) }).expect(400); // before startDate
    await as(teacher, "post", "/").send({ title: "X", dueAt: iso(200) }).expect(400); // after endDate
    await as(teacher, "post", "/").send({ title: "A", dueAt: iso(20) }).expect(201);
    // Duplicate dueAt is now allowed (team decision 2026-11-19)
    const dup = await as(teacher, "post", "/").send({ title: "B", dueAt: iso(20) }).expect(201);
    assert.equal(dup.body.assignment.title, "B");
  });

  it("rejects NoSQL objects, unknown fields, and empty titles", async () => {
    await as(teacher, "post", "/").send({ title: { $ne: null }, dueAt: iso(20) }).expect(400);
    await as(teacher, "post", "/").send({ title: "X", dueAt: iso(20), classroomId: "1" }).expect(400);
    await as(teacher, "post", "/").send({ title: "   ", dueAt: iso(20) }).expect(400);
  });

  it("title with <script> is stored as text and returned intact", async () => {
    const title = "<script>alert(1)</script>";
    const created = await as(teacher, "post", "/").send({ title, dueAt: iso(20) }).expect(201);
    assert.equal(created.body.assignment.title, title);
    const read = await as(teacher, "get", `/${created.body.assignment.id}`).expect(200);
    assert.equal(read.body.assignment.title, title);
  });

  it("with period already started responds 409 PERIOD_LOCKED", async () => {
    await Classroom.updateOne({ _id: classroom._id }, { "period.startDate": new Date(Date.now() - DAY) });
    const res = await as(teacher, "post", "/").send({ title: "X", dueAt: iso(20) }).expect(409);
    assert.equal(res.body.error.code, "PERIOD_LOCKED");
  });
});

describe("UN-107 · reading (GET)", () => {
  it("enrolled student and teacher read list sorted by dueAt", async () => {
    await as(teacher, "post", "/").send({ title: "Segunda", dueAt: iso(30) }).expect(201);
    await as(teacher, "post", "/").send({ title: "Primera", dueAt: iso(20) }).expect(201);
    for (const user of [teacher, student]) {
      const res = await as(user, "get", "/").expect(200);
      assert.deepEqual(res.body.assignments.map((a) => a.title), ["Primera", "Segunda"]);
    }
  });

  it("student without classroom gets 404; with foreign id 403; invalid id 400; nonexistent 404", async () => {
    const created = await as(teacher, "post", "/").send({ title: "A", dueAt: iso(20) }).expect(201);
    const id = created.body.assignment.id;
    await as(outsider, "get", "/").expect(404);
    await as(outsider, "get", `/${id}`).expect(403);
    await as(otherTeacher, "get", `/${id}`).expect(403);
    await as(teacher, "get", "/nope").expect(400);
    await as(teacher, "get", `/${new mongoose.Types.ObjectId()}`).expect(404);
  });
});

describe("UN-107 · PATCH and DELETE", () => {
  let id;
  beforeEach(async () => {
    const res = await as(teacher, "post", "/").send({ title: "A", dueAt: iso(20) });
    id = res.body.assignment.id;
  });

  it("owner teacher edits; student and other teacher get 403", async () => {
    const res = await as(teacher, "patch", `/${id}`).send({ title: "New", dueAt: iso(25) }).expect(200);
    assert.equal(res.body.assignment.title, "New");
    await as(student, "patch", `/${id}`).send({ title: "Hack" }).expect(403);
    await as(otherTeacher, "patch", `/${id}`).send({ title: "Hack" }).expect(403);
    await as(student, "delete", `/${id}`).expect(403);
    await as(otherTeacher, "delete", `/${id}`).expect(403);
    assert.equal((await Assignment.findById(id)).title, "New");
  });

  it("PATCH validates: empty, date outside period; allows duplicate dates", async () => {
    await as(teacher, "patch", `/${id}`).send({}).expect(400);
    await as(teacher, "patch", `/${id}`).send({ dueAt: iso(5) }).expect(400);
    await as(teacher, "post", "/").send({ title: "B", dueAt: iso(30) }).expect(201);
    // Duplicate dueAt is now allowed (team decision 2026-11-19)
    await as(teacher, "patch", `/${id}`).send({ dueAt: iso(30) }).expect(200);
  });

  it("DELETE deletes assignment and decrements counter", async () => {
    assert.equal((await Classroom.findById(classroom._id)).period.totalAssignments, 1);
    await as(teacher, "delete", `/${id}`).expect(200);
    assert.equal(await Assignment.countDocuments({}), 0);
    assert.equal((await Classroom.findById(classroom._id)).period.totalAssignments, 0);
    await as(teacher, "delete", `/${id}`).expect(404);
  });

  it("with period started, PATCH and DELETE respond 409 PERIOD_LOCKED and change nothing", async () => {
    await Classroom.updateOne({ _id: classroom._id }, { "period.startDate": new Date(Date.now() - DAY) });
    const patch = await as(teacher, "patch", `/${id}`).send({ title: "Tarde" }).expect(409);
    assert.equal(patch.body.error.code, "PERIOD_LOCKED");
    await as(teacher, "delete", `/${id}`).expect(409);
    assert.equal((await Assignment.findById(id)).title, "A");
  });
});

// ---------------------------------------------------------------------------
// UN-302 · Student step completion & submission
// ---------------------------------------------------------------------------

describe("UN-302 · POST /api/assignments/:id/steps", () => {
  let assignmentId;

  beforeEach(async () => {
    // Create assignment first (period not started yet), then start the period
    const res = await as(teacher, "post", "/").send({ title: "UN-302 Assignment", dueAt: iso(20) }).expect(201);
    assignmentId = res.body.assignment.id;
    await Classroom.updateOne({ _id: classroom._id }, { "period.startDate": new Date(Date.now() - DAY) });
    // Ensure student has a Pet (Pancho) for the current period
    const updatedClassroom = await Classroom.findById(classroom._id);
    await Pet.create({
      ownerId: student._id,
      periodId: updatedClassroom.period.periodId,
      coins: 270,
      health: 100,
      hunger: 100,
      status: "alive",
      panchoId: "pancho-1",
      imgUrl: "https://example.com/pancho.png",
    });
  });

  it("student completes steps 1, 2, and 3 successfully", async () => {
    for (const stepId of [1, 2, 3]) {
      const res = await as(student, "post", `/${assignmentId}/steps`).send({ stepId }).expect(200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.step.id, stepId);
      assert.equal(res.body.step.completed, true);
      assert.ok(res.body.state.currentAssignment);
    }
  });

  it("student cannot complete step 4 (only 1-3)", async () => {
    const res = await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 4 }).expect(400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("student cannot complete step 0 or negative", async () => {
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 0 }).expect(400);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: -1 }).expect(400);
  });

  it("completing already completed step returns 409 CONFLICT", async () => {
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(200);
    const res = await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
  });

  it("teacher gets 403 FORBIDDEN", async () => {
    await as(teacher, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(403);
  });

  it("no session gets 401", async () => {
    await as(null, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(401);
  });

  it("student without classroom uses default assignment and can complete steps", async () => {
    // outsider has no classroom, but needs a Pet to work on assignments
    await Pet.create({
      ownerId: outsider._id,
      periodId: new mongoose.Types.ObjectId(),
      coins: 270,
      health: 100,
      hunger: 100,
      status: "alive",
      panchoId: "pancho-1",
      imgUrl: "https://example.com/pancho.png",
    });
    // Outsider uses DEFAULT_ASSIGNMENT (id "000000000000000000000001")
    const defaultAssignmentId = "000000000000000000000001";
    const res = await as(outsider, "post", `/${defaultAssignmentId}/steps`).send({ stepId: 1 }).expect(200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.step.id, 1);
  });

  it("nonexistent assignment returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await as(student, "post", `/${fakeId}/steps`).send({ stepId: 1 }).expect(404);
  });

  it("invalid id returns 400", async () => {
    await as(student, "post", "/nope/steps").send({ stepId: 1 }).expect(400);
  });
});

describe("UN-302 · POST /api/assignments/:id/submit", () => {
  let assignmentId;

  beforeEach(async () => {
    // Create assignment first, then start the period
    const res = await as(teacher, "post", "/").send({ title: "Submit Assignment", dueAt: iso(20) }).expect(201);
    assignmentId = res.body.assignment.id;
    await Classroom.updateOne({ _id: classroom._id }, { "period.startDate": new Date(Date.now() - DAY) });
    // Ensure student has a Pet (Pancho) for the current period
    const updatedClassroom = await Classroom.findById(classroom._id);
    await Pet.create({
      ownerId: student._id,
      periodId: updatedClassroom.period.periodId,
      coins: 270,
      health: 100,
      hunger: 100,
      status: "alive",
      panchoId: "pancho-1",
      imgUrl: "https://example.com/pancho.png",
    });
    // Also ensure outsider has a Pet for default assignment tests
    await Pet.create({
      ownerId: outsider._id,
      periodId: new mongoose.Types.ObjectId(),
      coins: 270,
      health: 100,
      hunger: 100,
      status: "alive",
      panchoId: "pancho-1",
      imgUrl: "https://example.com/pancho.png",
    });
  });

  it("student submits after completing steps 1-3: creates Submission, hunger 100 (ADR 5.5), resets steps", async () => {
    // Complete steps 1-3
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(200);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 2 }).expect(200);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 3 }).expect(200);

    // Submit
    const res = await as(student, "post", `/${assignmentId}/submit`).expect(200);
    assert.equal(res.body.success, true);
    // Before submitting, hunger was ~95 (the task is due in 20 of 21 days): it recovers to 100.
    assert.ok(res.body.rewards.hunger >= 0 && res.body.rewards.hunger <= 10);
    assert.equal(res.body.state.dog.hunger, 100);
    assert.equal(res.body.state.student.assignmentsCompleted, 1);
    // Steps should be reset
    assert.ok(res.body.state.currentAssignment.steps.every((s) => s.completed === false));

    // Verify Submission document created
    const submission = await Submission.findOne({ studentId: student._id, assignmentId });
    assert.ok(submission);
    assert.equal(submission.status, "submitted");
  });

  it("submitting without completing steps 1-3 returns 409 CONFLICT", async () => {
    const res = await as(student, "post", `/${assignmentId}/submit`).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
    assert.match(res.body.error.message, /Complete steps 1-3/);
  });

  it("submitting same assignment twice returns 409 CONFLICT (unique index)", async () => {
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(200);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 2 }).expect(200);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 3 }).expect(200);
    await as(student, "post", `/${assignmentId}/submit`).expect(200);

    // Second submit should fail
    const res = await as(student, "post", `/${assignmentId}/submit`).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
    assert.match(res.body.error.message, /already submitted/);
  });

  it("teacher gets 403 FORBIDDEN", async () => {
    await as(teacher, "post", `/${assignmentId}/submit`).expect(403);
  });

  it("sin sesión recibe 401", async () => {
    await as(null, "post", `/${assignmentId}/submit`).expect(401);
  });

  it("student with DEAD dog cannot submit", async () => {
    // First complete steps
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(200);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 2 }).expect(200);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 3 }).expect(200);

    // Kill the pet (status must be lowercase "dead" per model)
    await Pet.updateOne({ ownerId: student._id }, { $set: { status: "dead", health: 0 } });

    const res = await as(student, "post", `/${assignmentId}/submit`).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
    assert.match(res.body.error.message, /Pancho can't submit/);
  });

  it("submissions of one student don't appear in another (resource ownership)", async () => {
    // Create another student in same classroom
    const student2 = await makeUser("carlos", "student", classroom._id);
    // Create Pet for student2
    const updatedClassroom = await Classroom.findById(classroom._id);
    await Pet.create({
      ownerId: student2._id,
      periodId: updatedClassroom.period.periodId,
      coins: 270,
      health: 100,
      hunger: 100,
      status: "alive",
      panchoId: "pancho-1",
      imgUrl: "https://example.com/pancho.png",
    });

    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(200);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 2 }).expect(200);
    await as(student, "post", `/${assignmentId}/steps`).send({ stepId: 3 }).expect(200);
    await as(student, "post", `/${assignmentId}/submit`).expect(200);

    // Student2 submits same assignment
    await as(student2, "post", `/${assignmentId}/steps`).send({ stepId: 1 }).expect(200);
    await as(student2, "post", `/${assignmentId}/steps`).send({ stepId: 2 }).expect(200);
    await as(student2, "post", `/${assignmentId}/steps`).send({ stepId: 3 }).expect(200);
    await as(student2, "post", `/${assignmentId}/submit`).expect(200);

    // Each has their own submission
    const submissions = await Submission.find({ assignmentId });
    assert.equal(submissions.length, 2);
    const studentIds = submissions.map((s) => s.studentId.toString()).sort();
    assert.deepEqual(studentIds, [student._id.toString(), student2._id.toString()].sort());
  });

  it("without classroom or active assignments uses default assignment", async () => {
    // outsider has no classroom but has a Pet (created in previous test)
    // The outsider will use the DEFAULT_ASSIGNMENT since they have no classroom
    const defaultAssignmentId = "000000000000000000000001";
    await as(outsider, "post", `/${defaultAssignmentId}/steps`).send({ stepId: 1 }).expect(200);
    await as(outsider, "post", `/${defaultAssignmentId}/steps`).send({ stepId: 2 }).expect(200);
    await as(outsider, "post", `/${defaultAssignmentId}/steps`).send({ stepId: 3 }).expect(200);
    const res = await as(outsider, "post", `/${defaultAssignmentId}/submit`).expect(200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.rewards, { hunger: 0 }); // hunger was already 100: nothing to recover
  });
});
