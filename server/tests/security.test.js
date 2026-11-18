// UN-603 · Security integration tests: helmet headers, NoSQL injection, origin policy,
// body size limit, unknown routes and passwordHash leaks.
// Run with: node --test server/tests/security.test.js   (node:test + mongodb-memory-server)

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");

let mongod;
let server;
let teacher, student, classroom;

const DAY = 24 * 60 * 60 * 1000;
const FOREIGN_ORIGIN = "https://sitio-ajeno.example";
const cookieOf = (user) => [`session=${signToken({ sub: user._id.toString() })}`];

async function makeUser(name, role, classroomId = null) {
  return User.create({ name, email: `${name}@test.com`, passwordHash: "x".repeat(60), role, classroomId });
}

// The hash must never reach the client, neither by field name nor by value.
function assertNoHash(body) {
  const text = JSON.stringify(body);
  assert.ok(!text.includes("passwordHash"), "response leaks the passwordHash field");
  assert.ok(!text.includes("x".repeat(20)), "response leaks a password hash value");
  assert.ok(!/\$2[aby]\$/.test(text), "response leaks a bcrypt hash");
}

before(async () => {
  mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.syncIndexes(), Classroom.syncIndexes()]);
  server = app.listen(0);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  server.close();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Classroom.deleteMany({})]);
  teacher = await makeUser("profe", "teacher");
  classroom = await Classroom.create({
    name: "Classroom",
    teacherId: teacher._id,
    joinCode: "ABC234",
    period: { startDate: new Date(Date.now() - DAY), endDate: new Date(Date.now() + 60 * DAY) },
  });
  await User.updateOne({ _id: teacher._id }, { classroomId: classroom._id });
  student = await makeUser("ana", "student", classroom._id);
});

describe("UN-603 · helmet headers", () => {
  it("GET /api/health sends the default helmet headers and hides x-powered-by", async () => {
    // The status depends on the database ping; only the headers matter here.
    const res = await request(server).get("/api/health");
    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.ok(res.headers["content-security-policy"], "missing content-security-policy");
    assert.ok(res.headers["strict-transport-security"], "missing strict-transport-security");
    assert.ok(res.headers["x-frame-options"], "missing x-frame-options");
    assert.ok(res.headers["referrer-policy"], "missing referrer-policy");
    assert.equal(res.headers["x-powered-by"], undefined);
  });

  it("error responses also carry the helmet headers", async () => {
    const res = await request(server).get("/api/me").expect(401);
    assert.equal(res.headers["x-content-type-options"], "nosniff");
  });
});

describe("UN-603 · NoSQL injection", () => {
  it("login with operator objects is rejected with 400 VALIDATION_ERROR", async () => {
    const res = await request(server)
      .post("/api/auth/login")
      .send({ email: { $ne: null }, password: { $ne: null } })
      .expect(400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
    assert.equal(res.headers["set-cookie"], undefined);
  });

  it("login with an operator only in the email is rejected too", async () => {
    await request(server).post("/api/auth/login").send({ email: { $gt: "" }, password: "whatever1" }).expect(400);
  });
});

describe("UN-603 · origin policy", () => {
  it("a foreign Origin gets 403 FORBIDDEN", async () => {
    const res = await request(server).get("/api/health").set("Origin", FOREIGN_ORIGIN).expect(403);
    assert.equal(res.body.error.code, "FORBIDDEN");
  });

  it("a foreign Origin is also blocked on authenticated routes", async () => {
    await request(server).get("/api/me").set("Cookie", cookieOf(teacher)).set("Origin", FOREIGN_ORIGIN).expect(403);
  });

  it("a request without Origin and the same-origin request are accepted", async () => {
    const plain = await request(server).get("/api/health");
    assert.notEqual(plain.status, 403);
    const sameOrigin = await request(server).get("/api/health").set("Origin", `http://127.0.0.1:${server.address().port}`);
    assert.notEqual(sameOrigin.status, 403);
  });
});

describe("UN-603 · request limits and unknown routes", () => {
  it("a body larger than 10 kB is rejected with 400", async () => {
    const res = await request(server)
      .post("/api/auth/login")
      .send({ email: "ana@test.com", password: "x".repeat(11 * 1024) })
      .expect(400);
    assert.equal(typeof res.body.error.code, "string");
  });

  it("an unknown /api route answers 404 with the standard error format", async () => {
    const res = await request(server).get("/api/desconocida").set("Cookie", cookieOf(teacher)).expect(404);
    assert.equal(res.body.error.code, "NOT_FOUND");
    assert.equal(typeof res.body.error.message, "string");
  });
});

describe("UN-603 · passwordHash is never exposed", () => {
  it("register, login and me do not leak the hash", async () => {
    const credentials = { email: "nuevo@test.com", password: "Secret123" };
    const registered = await request(server)
      .post("/api/auth/register")
      .send({ name: "Nuevo", ...credentials, role: "student" })
      .expect(201);
    assertNoHash(registered.body);

    const login = await request(server).post("/api/auth/login").send(credentials).expect(200);
    assertNoHash(login.body);

    const cookie = login.headers["set-cookie"].map((item) => item.split(";")[0]);
    const me = await request(server).get("/api/me").set("Cookie", cookie).expect(200);
    assertNoHash(me.body);
    assert.equal(me.body.user.email, credentials.email);
  });

  it("GET /api/classrooms/:id/students does not leak the hash", async () => {
    const res = await request(server)
      .get(`/api/classrooms/${classroom._id}/students`)
      .set("Cookie", cookieOf(teacher))
      .expect(200);
    assert.equal(res.body.students.length, 1);
    assertNoHash(res.body);
  });

  it("GET /api/classrooms/me does not leak the hash", async () => {
    const res = await request(server).get("/api/classrooms/me").set("Cookie", cookieOf(student)).expect(200);
    assertNoHash(res.body);
  });
});