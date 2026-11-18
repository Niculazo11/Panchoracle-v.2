// UN-603 · Integration tests for the classrooms API (/api/classrooms), the automated
// version of server/scripts/verify-un106.js, plus cross-classroom (IDOR) isolation checks.
// Run with: node --test server/tests/classrooms.test.js   (node:test + mongodb-memory-server)

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom, Assignment, Pet } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");

let mongod;
let server;
let teacher, otherTeacher, freshTeacher, student, otherStudent, newcomer, classroomA, classroomB;

const DAY = 24 * 60 * 60 * 1000;
// Join codes have 6 characters and never contain 0, O, 1, I or L.
const JOIN_CODE_FORMAT = /^[A-HJ-KM-NP-Z2-9]{6}$/;
const cookieOf = (user) => [`session=${signToken({ sub: user._id.toString() })}`];
const idOf = (item) => String(item.id ?? item._id);

const as = (user, method, path = "") => {
  const req = request(server)[method](`/api/classrooms${path}`);
  return user ? req.set("Cookie", cookieOf(user)) : req;
};

// Payload of POST /api/classrooms (createClassroomSchema: name, period and an optional joinCode).
const classroomPayload = (extra = {}) => ({
  name: "New classroom",
  period: { startDate: new Date(Date.now() - DAY).toISOString(), endDate: new Date(Date.now() + 60 * DAY).toISOString() },
  ...extra,
});

async function makeUser(name, role, classroomId = null) {
  return User.create({ name, email: `${name}@test.com`, passwordHash: "x".repeat(60), role, classroomId });
}

// Classroom whose period started yesterday and lasts 60 days.
async function makeClassroom(owner, joinCode) {
  const created = await Classroom.create({
    name: `Classroom ${joinCode}`,
    teacherId: owner._id,
    joinCode,
    period: { startDate: new Date(Date.now() - DAY), endDate: new Date(Date.now() + 60 * DAY) },
  });
  await User.updateOne({ _id: owner._id }, { classroomId: created._id });
  return created;
}

const makePet = (owner, classroom, extra = {}) =>
  Pet.create({
    ownerId: owner._id,
    periodId: classroom.period.periodId,
    coins: 270,
    health: 100,
    hunger: 100,
    status: "alive",
    panchoId: "dachshund-1",
    imgUrl: "https://images.dog.ceo/breeds/dachshund/dachshund-1.jpg",
    ...extra,
  });

before(async () => {
  mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.syncIndexes(), Classroom.syncIndexes(), Assignment.syncIndexes(), Pet.syncIndexes()]);
  server = app.listen(0);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  server.close();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Classroom.deleteMany({}), Assignment.deleteMany({}), Pet.deleteMany({})]);
  teacher = await makeUser("profe", "teacher");
  otherTeacher = await makeUser("profe2", "teacher");
  freshTeacher = await makeUser("profe3", "teacher"); // owns no classroom yet
  classroomA = await makeClassroom(teacher, "ABC234");
  classroomB = await makeClassroom(otherTeacher, "XYZ789");
  student = await makeUser("ana", "student", classroomA._id);
  otherStudent = await makeUser("beto", "student", classroomB._id);
  newcomer = await makeUser("carla", "student"); // enrolled nowhere
});

describe("UN-603 · POST /api/classrooms", () => {
  it("a teacher creates a classroom: 201 with a 6-character join code", async () => {
    const res = await as(freshTeacher, "post").send(classroomPayload()).expect(201);
    assert.match(res.body.classroom.joinCode, JOIN_CODE_FORMAT);
    assert.equal(res.body.classroom.name, "New classroom");
  });

  it("a second classroom for the same teacher gets 409 CONFLICT", async () => {
    const res = await as(teacher, "post").send(classroomPayload()).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
  });

  it("a custom join code already in use gets 409 CONFLICT", async () => {
    const res = await as(freshTeacher, "post").send(classroomPayload({ joinCode: "XYZ789" })).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
  });

  it("a student gets 403 and an anonymous request gets 401", async () => {
    await as(student, "post").send(classroomPayload()).expect(403);
    await as(null, "post").send(classroomPayload()).expect(401);
  });

  it("a body without period is rejected with 400 VALIDATION_ERROR", async () => {
    const res = await as(freshTeacher, "post").send({ name: "No period" }).expect(400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("NoSQL operators and unknown fields are rejected with 400", async () => {
    await as(freshTeacher, "post").send(classroomPayload({ name: { $ne: null } })).expect(400);
    await as(freshTeacher, "post").send(classroomPayload({ teacherId: "1" })).expect(400);
  });
});

describe("UN-603 · GET /api/classrooms/me", () => {
  it("the teacher and an enrolled student read their own classroom", async () => {
    const asTeacher = await as(teacher, "get", "/me").expect(200);
    assert.equal(idOf(asTeacher.body.classroom), classroomA._id.toString());
    const asStudent = await as(student, "get", "/me").expect(200);
    assert.equal(idOf(asStudent.body.classroom), classroomA._id.toString());
  });

  it("a user without a classroom gets 404 NOT_FOUND", async () => {
    const res = await as(newcomer, "get", "/me").expect(404);
    assert.equal(res.body.error.code, "NOT_FOUND");
  });
});

describe("UN-603 · POST /api/classrooms/join", () => {
  it("a student joins with a valid code: 201 and a Pancho with 270 coins", async () => {
    const res = await as(newcomer, "post", "/join").send({ joinCode: "ABC234" }).expect(201);
    assert.equal(res.body.alreadyJoined, false);
    assert.equal(idOf(res.body.classroom), classroomA._id.toString());

    assert.equal((await User.findById(newcomer._id)).classroomId.toString(), classroomA._id.toString());
    const pet = await Pet.findOne({ ownerId: newcomer._id });
    assert.ok(pet, "joining must create the Pancho");
    assert.equal(pet.coins, 270);
  });

  it("joining the same classroom again answers 200 with alreadyJoined", async () => {
    await as(newcomer, "post", "/join").send({ joinCode: "ABC234" }).expect(201);
    const again = await as(newcomer, "post", "/join").send({ joinCode: "ABC234" }).expect(200);
    assert.equal(again.body.alreadyJoined, true);
    assert.equal(await Pet.countDocuments({ ownerId: newcomer._id }), 1);
  });

  it("an unknown code gets 404 NOT_FOUND", async () => {
    const res = await as(newcomer, "post", "/join").send({ joinCode: "ZZZZZZ" }).expect(404);
    assert.equal(res.body.error.code, "NOT_FOUND");
  });

  it("a student already enrolled in another classroom gets 409 CONFLICT", async () => {
    const res = await as(student, "post", "/join").send({ joinCode: "XYZ789" }).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
    assert.equal((await User.findById(student._id)).classroomId.toString(), classroomA._id.toString());
  });

  it("a teacher gets 403, an anonymous request 401 and an operator object 400", async () => {
    await as(teacher, "post", "/join").send({ joinCode: "XYZ789" }).expect(403);
    await as(null, "post", "/join").send({ joinCode: "XYZ789" }).expect(401);
    await as(newcomer, "post", "/join").send({ joinCode: { $ne: null } }).expect(400);
  });
});

describe("UN-603 · PATCH and DELETE /api/classrooms/:id", () => {
  it("the owner renames the classroom", async () => {
    const res = await as(teacher, "patch", `/${classroomA._id}`).send({ name: "Renamed" }).expect(200);
    assert.equal(res.body.classroom.name, "Renamed");
    assert.equal((await Classroom.findById(classroomA._id)).name, "Renamed");
  });

  it("another teacher and a student get 403 and nothing changes", async () => {
    await as(otherTeacher, "patch", `/${classroomA._id}`).send({ name: "Hacked" }).expect(403);
    await as(student, "patch", `/${classroomA._id}`).send({ name: "Hacked" }).expect(403);
    await as(otherTeacher, "delete", `/${classroomA._id}`).expect(403);
    await as(student, "delete", `/${classroomA._id}`).expect(403);
    assert.equal((await Classroom.findById(classroomA._id)).name, "Classroom ABC234");
  });

  it("a missing classroom gets 404 and an invalid id gets 400", async () => {
    const missing = new mongoose.Types.ObjectId();
    await as(teacher, "patch", `/${missing}`).send({ name: "X" }).expect(404);
    await as(teacher, "delete", `/${missing}`).expect(404);
    await as(teacher, "patch", "/nope").send({ name: "X" }).expect(400);
  });

  it("deleting a classroom unregisters its students but keeps their pets", async () => {
    await makePet(student, classroomA);
    const res = await as(teacher, "delete", `/${classroomA._id}`).expect(200);
    assert.equal(res.body.deleted, true);
    assert.equal(res.body.unenrolledStudents, 1);

    assert.equal(await Classroom.findById(classroomA._id), null);
    assert.equal((await User.findById(teacher._id)).classroomId ?? null, null);
    assert.equal((await User.findById(student._id)).classroomId ?? null, null);
    assert.equal(await Pet.countDocuments({ ownerId: student._id }), 1, "the Pancho must survive");
    assert.ok(await Classroom.findById(classroomB._id), "other classrooms are untouched");
  });
});

describe("UN-603 · students of a classroom", () => {
  it("the owner lists the enrolled students", async () => {
    const res = await as(teacher, "get", `/${classroomA._id}/students`).expect(200);
    assert.equal(res.body.students.length, 1);
    assert.ok(!JSON.stringify(res.body).includes("passwordHash"));
  });

  it("IDOR: another teacher and a student cannot list them (403)", async () => {
    await as(otherTeacher, "get", `/${classroomA._id}/students`).expect(403);
    await as(student, "get", `/${classroomA._id}/students`).expect(403);
  });

  it("the owner removes an enrolled student; the route answers 200 { removed }", async () => {
    const res = await as(teacher, "delete", `/${classroomA._id}/students/${student._id}`).expect(200);
    assert.equal(res.body.removed, true);
    assert.equal(res.body.studentId, student._id.toString());
    assert.equal((await User.findById(student._id)).classroomId ?? null, null);
  });

  it("removing a student that is not enrolled gets 404", async () => {
    await as(teacher, "delete", `/${classroomA._id}/students/${otherStudent._id}`).expect(404);
    assert.equal((await User.findById(otherStudent._id)).classroomId.toString(), classroomB._id.toString());
  });

  it("IDOR: another teacher cannot remove or restore a student of classroom A (403)", async () => {
    await as(otherTeacher, "delete", `/${classroomA._id}/students/${student._id}`).expect(403);
    await as(otherTeacher, "post", `/${classroomA._id}/students/${student._id}/restore-health`)
      .send({ reason: "not my student" })
      .expect(403);
    assert.equal((await User.findById(student._id)).classroomId.toString(), classroomA._id.toString());
  });
});

describe("UN-603 · cross-classroom isolation (IDOR)", () => {
  it("a student of classroom A cannot read an assignment of classroom B (403)", async () => {
    const foreign = await Assignment.create({
      classroomId: classroomB._id,
      periodId: classroomB.period.periodId,
      title: "Private to B",
      description: "Not for A",
      dueAt: new Date(Date.now() + 10 * DAY),
    });
    await request(server).get(`/api/assignments/${foreign._id}`).set("Cookie", cookieOf(student)).expect(403);
    await request(server).get(`/api/assignments/${foreign._id}`).set("Cookie", cookieOf(teacher)).expect(403);
  });

  it("GET /api/assignments only lists the assignments of the caller's classroom", async () => {
    const dueAt = new Date(Date.now() + 10 * DAY);
    await Assignment.create({ classroomId: classroomA._id, periodId: classroomA.period.periodId, title: "Only A", description: "A", dueAt });
    await Assignment.create({ classroomId: classroomB._id, periodId: classroomB.period.periodId, title: "Only B", description: "B", dueAt });
    const res = await request(server).get("/api/assignments").set("Cookie", cookieOf(student)).expect(200);
    assert.deepEqual(res.body.assignments.map((item) => item.title), ["Only A"]);
  });

  it("GET /api/me/game always returns the caller's own Pancho", async () => {
    await makePet(student, classroomA, { imgUrl: "https://images.dog.ceo/breeds/dachshund/own-ana.jpg", panchoId: "own-ana", coins: 111 });
    await makePet(otherStudent, classroomB, { imgUrl: "https://images.dog.ceo/breeds/dachshund/own-beto.jpg", panchoId: "own-beto", coins: 222 });

    const mine = await request(server).get("/api/me/game").set("Cookie", cookieOf(student)).expect(200);
    assert.equal(mine.body.dog.id, "own-ana");
    assert.equal(mine.body.student.coins, 111);
    const theirs = await request(server).get("/api/me/game").set("Cookie", cookieOf(otherStudent)).expect(200);
    assert.equal(theirs.body.dog.id, "own-beto");
  });

  it("GET /api/me/game answers 403 to a teacher and 404 to a student without classroom", async () => {
    await request(server).get("/api/me/game").set("Cookie", cookieOf(teacher)).expect(403);
    await request(server).get("/api/me/game").set("Cookie", cookieOf(newcomer)).expect(404);
  });
});