// Integration tests of the submissions API (docs/submissions-api.md):
//   POST /api/assignments/:id/submissions, GET /api/assignments/:id/submissions,
//   GET /api/me/submissions and GET /api/submissions/:id/file.
// Run with: node --test server/tests/submissions.test.js   (node:test + mongodb-memory-server)

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom, Assignment, Pet, Submission, SubmissionFile } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");

let mongod;
let server;
let teacher, otherTeacher, student, otherStudent, outsider, classroom, assignment, laterAssignment;

const DAY = 24 * 60 * 60 * 1000;
const cookieOf = (user) => [`session=${signToken({ sub: user._id.toString() })}`];

function call(user, method, path) {
  const req = request(server)[method](path);
  return user ? req.set("Cookie", cookieOf(user)) : req;
}

// Smallest valid bytes of each allowed type (only the first bytes matter to the server).
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("fake jpeg body")]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("fake png body")]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([4, 0, 0, 0]), Buffer.from("WEBPVP8 ")]);
const PDF = Buffer.from("%PDF-1.4\n% fake pdf body\n");

const fileBody = (bytes, overrides = {}) => ({
  kind: "file",
  fileName: "homework.jpg",
  mimeType: "image/jpeg",
  dataBase64: bytes.toString("base64"),
  ...overrides,
});
const linkBody = (url = "https://docs.google.com/document/d/abc") => ({ kind: "link", url });
const handIn = (user, id, body) => call(user, "post", `/api/assignments/${id}/submissions`).send(body);

async function makeUser(name, role, classroomId = null) {
  return User.create({ name, email: `${name}@test.com`, passwordHash: "x".repeat(60), role, classroomId });
}

async function makePet(owner, periodId) {
  return Pet.create({
    ownerId: owner._id,
    periodId,
    coins: 270,
    health: 100,
    hunger: 100,
    status: "alive",
    panchoId: "pancho-1",
    imgUrl: "https://example.com/pancho.png",
  });
}

before(async () => {
  mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Assignment.syncIndexes(), Submission.syncIndexes(), SubmissionFile.syncIndexes()]);
  server = app.listen(0);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  server.close();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Classroom.deleteMany({}),
    Assignment.deleteMany({}),
    Pet.deleteMany({}),
    Submission.deleteMany({}),
    SubmissionFile.deleteMany({}),
  ]);

  teacher = await makeUser("teacher", "teacher");
  otherTeacher = await makeUser("teacher2", "teacher");

  // Period started yesterday and lasts 60 days.
  classroom = await Classroom.create({
    name: "Room",
    teacherId: teacher._id,
    joinCode: "ABC234",
    period: { startDate: new Date(Date.now() - DAY), endDate: new Date(Date.now() + 60 * DAY) },
  });
  await User.updateOne({ _id: teacher._id }, { classroomId: classroom._id });
  const otherRoom = await Classroom.create({
    name: "Other",
    teacherId: otherTeacher._id,
    joinCode: "XYZ789",
    period: { startDate: new Date(Date.now() - DAY), endDate: new Date(Date.now() + 60 * DAY) },
  });
  await User.updateOne({ _id: otherTeacher._id }, { classroomId: otherRoom._id });

  student = await makeUser("ana", "student", classroom._id);
  otherStudent = await makeUser("luis", "student", classroom._id);
  outsider = await makeUser("beto", "student", otherRoom._id);
  await makePet(student, classroom.period.periodId);
  await makePet(otherStudent, classroom.period.periodId);
  await makePet(outsider, otherRoom.period.periodId);

  const common = { classroomId: classroom._id, periodId: classroom.period.periodId };
  assignment = await Assignment.create({ ...common, title: "Task 1", dueAt: new Date(Date.now() + 5 * DAY) });
  laterAssignment = await Assignment.create({ ...common, title: "Task 2", dueAt: new Date(Date.now() + 10 * DAY) });
  await Classroom.updateOne({ _id: classroom._id }, { "period.totalAssignments": 2 });
});

describe("POST /api/assignments/:id/submissions · hand in a link", () => {
  it("a student hands in a link: 201 with the documented shape", async () => {
    const res = await handIn(student, assignment._id, linkBody()).expect(201);
    const { submission } = res.body;
    assert.equal(submission.assignmentId, assignment._id.toString());
    assert.equal(submission.kind, "link");
    assert.equal(submission.fileUrl, "https://docs.google.com/document/d/abc");
    assert.ok(submission.id && submission.fileName && submission.submittedAt);
    assert.equal(await Submission.countDocuments({ studentId: student._id }), 1);
    assert.equal(await SubmissionFile.countDocuments({}), 0); // a link stores no bytes
  });

  it("rejects links that are not http or https (javascript:, data:, ftp:, text)", async () => {
    for (const url of ["javascript:alert(1)", "data:text/html,<script>1</script>", "ftp://x.com/a", "not a link", ""]) {
      const res = await handIn(student, assignment._id, linkBody(url)).expect(400);
      assert.equal(res.body.error.code, "VALIDATION_ERROR");
    }
    assert.equal(await Submission.countDocuments({}), 0);
  });

  it("rejects a link longer than 2000 characters", async () => {
    await handIn(student, assignment._id, linkBody("https://x.com/" + "a".repeat(2000))).expect(400);
  });

  it("rejects unknown keys and a missing or unknown kind", async () => {
    await handIn(student, assignment._id, { ...linkBody(), extra: 1 }).expect(400);
    await handIn(student, assignment._id, { url: "https://x.com" }).expect(400);
    await handIn(student, assignment._id, { kind: "zip" }).expect(400);
    await call(student, "post", `/api/assignments/${assignment._id}/submissions`).expect(400); // no body
  });
});

describe("POST /api/assignments/:id/submissions · hand in a file", () => {
  it("a student hands in a photo: the bytes are stored and served back", async () => {
    const res = await handIn(student, assignment._id, fileBody(JPEG)).expect(201);
    const { submission } = res.body;
    assert.equal(submission.kind, "file");
    assert.equal(submission.fileName, "homework.jpg");
    assert.equal(submission.fileUrl, `/api/submissions/${submission.id}/file`);

    const stored = await SubmissionFile.findOne({ submissionId: submission.id });
    assert.equal(stored.mimeType, "image/jpeg");
    assert.equal(stored.size, JPEG.length);

    const file = await call(student, "get", submission.fileUrl).expect(200);
    assert.match(file.headers["content-type"], /^image\/jpeg/);
    assert.match(file.headers["content-disposition"], /^inline/);
    assert.deepEqual(Buffer.from(file.body), JPEG);
  });

  it("accepts png, webp and pdf when the bytes match", async () => {
    const cases = [
      [PNG, "image/png", "a.png"],
      [WEBP, "image/webp", "a.webp"],
      [PDF, "application/pdf", "a.pdf"],
    ];
    for (const [bytes, mimeType, fileName] of cases) {
      await Submission.deleteMany({});
      await SubmissionFile.deleteMany({});
      await handIn(student, assignment._id, fileBody(bytes, { mimeType, fileName })).expect(201);
    }
  });

  it("checks the real bytes, not the type that was sent", async () => {
    // PNG bytes sent as JPEG, a script sent as PDF, and a file with a type that is not allowed.
    await handIn(student, assignment._id, fileBody(PNG, { mimeType: "image/jpeg" })).expect(400);
    await handIn(student, assignment._id, fileBody(Buffer.from("<script>alert(1)</script>"), { mimeType: "application/pdf", fileName: "a.pdf" })).expect(400);
    await handIn(student, assignment._id, fileBody(PDF, { mimeType: "text/html", fileName: "a.html" })).expect(400);
    assert.equal(await Submission.countDocuments({}), 0);
  });

  it("rejects a file bigger than 3 MB (decoded)", async () => {
    const big = Buffer.concat([JPEG, Buffer.alloc(3 * 1024 * 1024)]);
    const res = await handIn(student, assignment._id, fileBody(big)).expect(400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("accepts a file of exactly 3 MB: the route reads bodies of about 4 MB", async () => {
    const exact = Buffer.concat([JPEG, Buffer.alloc(3 * 1024 * 1024 - JPEG.length)]);
    assert.equal(exact.length, 3 * 1024 * 1024);
    await handIn(student, assignment._id, fileBody(exact)).expect(201);
  });

  it("rejects bad base64, empty data and bad file names", async () => {
    await handIn(student, assignment._id, fileBody(JPEG, { dataBase64: "not base64!!" })).expect(400);
    await handIn(student, assignment._id, fileBody(JPEG, { dataBase64: "" })).expect(400);
    await handIn(student, assignment._id, fileBody(JPEG, { fileName: "../etc/passwd" })).expect(400);
    await handIn(student, assignment._id, fileBody(JPEG, { fileName: "a\\b.jpg" })).expect(400);
    await handIn(student, assignment._id, fileBody(JPEG, { fileName: "a".repeat(121) })).expect(400);
    await handIn(student, assignment._id, fileBody(JPEG, { fileName: "   " })).expect(400);
  });

  it("the big body limit only applies to this route", async () => {
    const res = await call(teacher, "post", "/api/assignments").send({ title: "x", description: "y".repeat(20 * 1024), dueAt: new Date(Date.now() + 3 * DAY).toISOString() });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.message, "The request body is too large");
  });

  it("a teacher or an anonymous caller cannot send a big body to this route", async () => {
    const big = fileBody(Buffer.concat([JPEG, Buffer.alloc(100 * 1024)]));
    await handIn(null, assignment._id, big).expect(401);
    await handIn(teacher, assignment._id, big).expect(403);
  });
});

describe("POST /api/assignments/:id/submissions · rules", () => {
  it("a teacher gets 403 and no session gets 401", async () => {
    await handIn(teacher, assignment._id, linkBody()).expect(403);
    await handIn(null, assignment._id, linkBody()).expect(401);
  });

  it("an invalid id gets 400 and an unknown assignment gets 404", async () => {
    await handIn(student, "nope", linkBody()).expect(400);
    await handIn(student, new mongoose.Types.ObjectId(), linkBody()).expect(404);
  });

  it("an assignment of another classroom gets 403", async () => {
    await handIn(outsider, assignment._id, linkBody()).expect(403);
    assert.equal(await Submission.countDocuments({}), 0);
  });

  it("an assignment of a past period gets 404", async () => {
    const old = await Assignment.create({
      classroomId: classroom._id,
      periodId: new mongoose.Types.ObjectId(),
      title: "Old",
      dueAt: new Date(Date.now() + 3 * DAY),
    });
    await handIn(student, old._id, linkBody()).expect(404);
  });

  it("handing in twice gets 409 CONFLICT and keeps the first one", async () => {
    await handIn(student, assignment._id, linkBody("https://one.com")).expect(201);
    const res = await handIn(student, assignment._id, linkBody("https://two.com")).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
    const all = await Submission.find({ studentId: student._id });
    assert.equal(all.length, 1);
    assert.equal(all[0].fileUrl, "https://one.com");
  });

  it("two requests at the same time: only one wins (unique index)", async () => {
    const results = await Promise.all([
      handIn(student, assignment._id, fileBody(JPEG)),
      handIn(student, assignment._id, fileBody(JPEG)),
    ]);
    assert.deepEqual(results.map((res) => res.status).sort(), [201, 409]);
    assert.equal(await Submission.countDocuments({ studentId: student._id }), 1);
    assert.equal(await SubmissionFile.countDocuments({}), 1); // the loser left no file behind
  });

  it("a dead Pancho cannot hand in: 409 CONFLICT", async () => {
    await Pet.updateOne({ ownerId: student._id }, { $set: { status: "dead", health: 0 } });
    const res = await handIn(student, assignment._id, linkBody()).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
    assert.equal(await Submission.countDocuments({}), 0);
  });

  it("a student without a Pancho gets 404", async () => {
    await Pet.deleteMany({ ownerId: student._id });
    await handIn(student, assignment._id, linkBody()).expect(404);
  });

  it("after dueAt: 409 ASSIGNMENT_EXPIRED (no late submissions)", async () => {
    const late = await Assignment.create({
      classroomId: classroom._id,
      periodId: classroom.period.periodId,
      title: "Late",
      dueAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    const res = await handIn(student, late._id, linkBody()).expect(409);
    assert.equal(res.body.error.code, "ASSIGNMENT_EXPIRED");
    assert.equal(await Submission.countDocuments({}), 0);
  });

  it("before the period starts: 409 CONFLICT", async () => {
    await Classroom.updateOne({ _id: classroom._id }, { "period.startDate": new Date(Date.now() + 2 * DAY) });
    const res = await handIn(student, assignment._id, linkBody()).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
  });

  it("any open assignment can be handed in, in any order", async () => {
    await handIn(student, laterAssignment._id, linkBody("https://later.com")).expect(201);
    await handIn(student, assignment._id, linkBody("https://first.com")).expect(201);
    assert.equal(await Submission.countDocuments({ studentId: student._id }), 2);
  });

    it("handing in the ACTIVE assignment recalculates hunger for the next deadline and leaves health alone", async () => {
    await Pet.updateOne({ ownerId: student._id }, { $set: { hunger: 20, health: 70 } });
    await handIn(student, assignment._id, linkBody()).expect(201);
    const pet = await Pet.findOne({ ownerId: student._id });
    // Task 2 is now the active one and was created a moment ago, so its countdown is almost full.
    assert.ok(pet.hunger > 99.9 && pet.hunger <= 100);
    assert.equal(pet.health, 70);
  });

  it("handing in an assignment that is NOT the active one leaves health alone", async () => {
    await Pet.updateOne({ ownerId: student._id }, { $set: { hunger: 20, health: 70 } });
    await handIn(student, laterAssignment._id, linkBody()).expect(201);
    const game = await call(student, "get", "/api/me/game").expect(200);
    assert.equal(game.body.dog.health, 70);
    assert.ok(game.body.dog.hunger > 99.9); // still counting down to the first (active) task
  });

  it("handing in everything that is pending puts hunger back at 100", async () => {
    await handIn(student, assignment._id, linkBody()).expect(201);
    await handIn(student, laterAssignment._id, linkBody()).expect(201);
    const game = await call(student, "get", "/api/me/game").expect(200);
    assert.equal(game.body.dog.hunger, 100);
  });

  it("the submission counts in the game state (assignmentsCompleted) and the next task moves on", async () => {
    await handIn(student, assignment._id, linkBody()).expect(201);
    const game = await call(student, "get", "/api/me/game").expect(200);
    assert.equal(game.body.student.assignmentsCompleted, 1);
    assert.equal(game.body.currentAssignment.id, laterAssignment._id.toString());
  });
});

describe("GET /api/me/submissions", () => {
  it("a student sees only their own submissions", async () => {
    await handIn(student, assignment._id, linkBody("https://ana.com")).expect(201);
    await handIn(otherStudent, assignment._id, linkBody("https://luis.com")).expect(201);
    const res = await call(student, "get", "/api/me/submissions").expect(200);
    assert.equal(res.body.submissions.length, 1);
    assert.equal(res.body.submissions[0].fileUrl, "https://ana.com");
    assert.deepEqual(Object.keys(res.body.submissions[0]).sort(), ["assignmentId", "fileName", "fileUrl", "id", "kind", "submittedAt"]);
  });

  it("empty list when nothing was handed in; teacher 403; no session 401", async () => {
    const res = await call(student, "get", "/api/me/submissions").expect(200);
    assert.deepEqual(res.body, { submissions: [] });
    await call(teacher, "get", "/api/me/submissions").expect(403);
    await call(null, "get", "/api/me/submissions").expect(401);
  });
});

describe("GET /api/assignments/:id/submissions", () => {
  it("the owner teacher sees every submission, oldest first, with the student", async () => {
    await handIn(otherStudent, assignment._id, linkBody("https://luis.com")).expect(201);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await handIn(student, assignment._id, fileBody(PDF, { mimeType: "application/pdf", fileName: "ana.pdf" })).expect(201);

    const res = await call(teacher, "get", `/api/assignments/${assignment._id}/submissions`).expect(200);
    const list = res.body.submissions;
    assert.equal(list.length, 2);
    assert.deepEqual(list.map((item) => item.student.name), ["luis", "ana"]);
    assert.equal(list[0].student.id, otherStudent._id.toString());
    assert.deepEqual(Object.keys(list[1]).sort(), ["assignmentId", "fileName", "fileUrl", "id", "kind", "student", "submittedAt"]);
    assert.equal(list[1].kind, "file");
    assert.equal(list[1].fileName, "ana.pdf");
    assert.ok(new Date(list[0].submittedAt) <= new Date(list[1].submittedAt));
  });

  it("an empty list when nobody handed in", async () => {
    const res = await call(teacher, "get", `/api/assignments/${assignment._id}/submissions`).expect(200);
    assert.deepEqual(res.body, { submissions: [] });
  });

  it("only returns the submissions of that assignment", async () => {
    await handIn(student, assignment._id, linkBody("https://one.com")).expect(201);
    await handIn(student, laterAssignment._id, linkBody("https://two.com")).expect(201);
    const res = await call(teacher, "get", `/api/assignments/${laterAssignment._id}/submissions`).expect(200);
    assert.deepEqual(res.body.submissions.map((item) => item.fileUrl), ["https://two.com"]);
  });

  it("students get 403, another teacher gets 403, no session 401", async () => {
    await call(student, "get", `/api/assignments/${assignment._id}/submissions`).expect(403);
    await call(otherTeacher, "get", `/api/assignments/${assignment._id}/submissions`).expect(403);
    await call(null, "get", `/api/assignments/${assignment._id}/submissions`).expect(401);
  });

  it("an invalid id gets 400 and an unknown assignment gets 404", async () => {
    await call(teacher, "get", "/api/assignments/nope/submissions").expect(400);
    await call(teacher, "get", `/api/assignments/${new mongoose.Types.ObjectId()}/submissions`).expect(404);
  });
});

describe("GET /api/submissions/:id/file", () => {
  let submission;

  beforeEach(async () => {
    const res = await handIn(student, assignment._id, fileBody(PDF, { mimeType: "application/pdf", fileName: "my report.pdf" })).expect(201);
    submission = res.body.submission;
  });

  it("the owner student and the teacher of the classroom get the file inline", async () => {
    for (const user of [student, teacher]) {
      const res = await call(user, "get", submission.fileUrl).expect(200);
      assert.match(res.headers["content-type"], /^application\/pdf/);
      assert.match(res.headers["content-disposition"], /^inline; filename="my report\.pdf"/);
      assert.equal(res.headers["x-content-type-options"], "nosniff");
      assert.deepEqual(Buffer.from(res.body), PDF);
    }
  });

  it("another student, another teacher and no session are refused", async () => {
    await call(otherStudent, "get", submission.fileUrl).expect(403);
    await call(outsider, "get", submission.fileUrl).expect(403);
    await call(otherTeacher, "get", submission.fileUrl).expect(403);
    await call(null, "get", submission.fileUrl).expect(401);
  });

  it("an invalid or unknown id and a link submission get 400 or 404", async () => {
    await call(student, "get", "/api/submissions/nope/file").expect(400);
    await call(student, "get", `/api/submissions/${new mongoose.Types.ObjectId()}/file`).expect(404);
    const link = await handIn(otherStudent, assignment._id, linkBody()).expect(201);
    await call(otherStudent, "get", `/api/submissions/${link.body.submission.id}/file`).expect(404);
  });

  it("a name with quotes or accents cannot break the header", async () => {
    await Submission.updateOne({ _id: submission.id }, { fileName: 'ta"rea ñandú.pdf' });
    const res = await call(student, "get", submission.fileUrl).expect(200);
    assert.ok(!/ta"rea/.test(res.headers["content-disposition"]));
    assert.match(res.headers["content-disposition"], /filename\*=UTF-8''/);
  });
});

describe("deleting an assignment removes its submissions and stored files", () => {
  it("DELETE /api/assignments/:id leaves no orphan in submission_files", async () => {
    await handIn(student, assignment._id, fileBody(JPEG)).expect(201);
    await handIn(otherStudent, assignment._id, fileBody(PDF, { mimeType: "application/pdf", fileName: "a.pdf" })).expect(201);
    await handIn(student, laterAssignment._id, fileBody(PNG, { mimeType: "image/png", fileName: "b.png" })).expect(201);
    assert.equal(await SubmissionFile.countDocuments({}), 3);

    await call(teacher, "delete", `/api/assignments/${assignment._id}`).expect(200);
    assert.equal(await Submission.countDocuments({ assignmentId: assignment._id }), 0);
    assert.equal(await SubmissionFile.countDocuments({}), 1); // only the other assignment's file is left
  });
});
