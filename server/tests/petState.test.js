// UN-108 · Hunger and health calculated on server, with simulated clock.
// Part 1: pure function (no database). Part 2: integration with MongoDB.
// Run with: node --test server/tests/petState.test.js

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom, Assignment, Pet, Submission, Cosmetic } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");
const { clock } = await import("../utils/clock.js");
const { computePetState } = await import("../services/petStateService.js");

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-08-01T00:00:00.000Z"); // period start
const at = (days) => new Date(T0 + days * DAY);
const period = { startDate: at(0), endDate: at(60) };
const fresh = { health: 100, hunger: 100, status: "alive" };
const tasks = (...days) => days.map((d, i) => ({ id: `a${i + 1}`, dueAt: at(d) }));
const run = (days, { assignments, submitted = [], pet = fresh }) =>
  computePetState({ pet, period, assignments, submittedIds: new Set(submitted), now: T0 + days * DAY });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);

describe("UN-108 · computePetState (simulated clock)", () => {
  const five = tasks(5);

  it("hunger drops linearly until due date (ADR 5.3)", () => {
    for (const [day, hunger] of [[0, 100], [1.25, 75], [2.5, 50], [3.75, 25], [5, 0]]) {
      near(run(day, { assignments: five }).hunger, hunger);
    }
  });

  it("before period starts everything is at max", () => {
    const state = computePetState({ pet: fresh, period, assignments: five, submittedIds: new Set(), now: T0 - DAY });
    assert.deepEqual(state, { health: 100, hunger: 100, status: "alive" });
  });

  it("second task window starts at first task due date", () => {
    const two = tasks(5, 15);
    near(run(10, { assignments: two, submitted: ["a1"] }).hunger, 50); // mitad de [5, 15]
    // Entregó la primera el día 1: hasta el día 5 el hambre sigue al máximo.
    near(run(3, { assignments: two, submitted: ["a1"] }).hunger, 100);
  });

  it("health only drops when task missed without submission (3 tasks: 1 failed = 66.67)", () => {
    const three = tasks(5, 10, 15);
    assert.equal(run(4.9, { assignments: three }).health, 100);
    near(run(5.1, { assignments: three }).health, 200 / 3);
    near(run(5.1, { assignments: three, submitted: ["a1"] }).health, 100);
  });

  it("5 tasks: each failed one deducts 20", () => {
    const list = tasks(1, 2, 3, 4, 5);
    assert.equal(run(1.5, { assignments: list }).health, 80);
    assert.equal(run(2.5, { assignments: list }).health, 60);
    assert.equal(run(3.5, { assignments: list, submitted: ["a1"] }).health, 60); // a2 y a3 falladas
  });

  it("no active task: hunger 0 if last missed; 100 if submitted", () => {
    const list = tasks(5, 10);
    assert.equal(run(11, { assignments: list, submitted: ["a1"] }).hunger, 0);
    assert.equal(run(11, { assignments: list, submitted: ["a1", "a2"] }).hunger, 100);
  });

  it("no tasks in period: 100 and 100, nothing to miss", () => {
    assert.deepEqual(run(30, { assignments: [] }), { health: 100, hunger: 100, status: "alive" });
  });

  it("all missed: health 0 and dead status", () => {
    assert.deepEqual(run(20, { assignments: tasks(5, 10, 15) }), { health: 0, hunger: 0, status: "dead" });
  });

  it("long absence = same result as staying connected (no false decay cap)", () => {
    const list = tasks(5, 10, 15, 20);
    let pet = fresh;
    for (let d = 0; d <= 12; d += 0.5) pet = run(d, { assignments: list, pet });
    assert.deepEqual(pet, run(12, { assignments: list }));
    // 15 minutos o 15 días fuera: solo importan las fechas, no los ticks.
    assert.equal(run(0.0104, { assignments: tasks(30) }).status, "alive");
  });

  it("a DEAD dog never changes again, not with submissions nor time", () => {
    const dead = { health: 0, hunger: 0, status: "dead" };
    const list = tasks(5, 10);
    for (const d of [0, 7, 100]) {
      assert.deepEqual(run(d, { assignments: list, submitted: ["a1", "a2"], pet: dead }), dead);
    }
  });

  it("is idempotent: reconciling result again doesn't change it", () => {
    const once = run(7, { assignments: tasks(5, 10) });
    assert.deepEqual(run(7, { assignments: tasks(5, 10), pet: { ...once } }), once);
  });

  it("healthAdjustment (UN-108 Rev. 2.3): added to base calculation and reconciliation doesn't override it", () => {
    const list = tasks(1, 2, 3, 4, 5);
    const forgiven = { ...fresh, healthAdjustment: 20 };
    assert.equal(run(2.5, { assignments: list }).health, 60);
    assert.equal(run(2.5, { assignments: list, pet: forgiven }).health, 80); // perdonó 20
    // Después sigue perdiendo vida por las nuevas tareas falladas, conservando el perdón.
    assert.equal(run(3.5, { assignments: list, pet: forgiven }).health, 60);
    // Repetir la reconciliación no vuelve a sumar ni a restar.
    const once = run(3.5, { assignments: list, pet: forgiven });
    assert.deepEqual(run(3.5, { assignments: list, pet: { ...forgiven, ...once } }), once);
  });

  it("healthAdjustment never exceeds 100 nor revives a dead dog", () => {
    assert.equal(run(1, { assignments: tasks(5), pet: { ...fresh, healthAdjustment: 100 } }).health, 100);
    const dead = { health: 0, hunger: 0, status: "dead", healthAdjustment: 50 };
    assert.deepEqual(run(7, { assignments: tasks(5), pet: dead }), { health: 0, hunger: 0, status: "dead" });
  });

  it("restoring all lost (66.67 + 33.33) gives exactly 100", () => {
    const three = tasks(5, 10, 15);
    const lost = 100 - run(5.1, { assignments: three }).health;
    const pet = { ...fresh, healthAdjustment: Math.round(lost * 1e9) / 1e9 };
    assert.equal(run(5.1, { assignments: three, pet }).health, 100);
  });
});

describe("UN-108 · integration (API + MongoDB, simulated clock)", () => {
  let mongod, server, teacher, student, classroom, a1, a2;
  const call = (user, method, path) =>
    request(server)[method](path).set("Cookie", [`session=${signToken({ sub: user._id.toString() })}`]);
  const game = async (days) => {
    clock.now = () => T0 + days * DAY;
    return (await call(student, "get", "/api/me/game").expect(200)).body;
  };

  before(async () => {
    mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
    process.env.MONGODB_URI = mongod.getUri();
    await mongoose.connect(mongod.getUri());
    server = app.listen(0);
  });
  after(async () => {
    clock.now = () => Date.now();
    await mongoose.disconnect();
    await mongod.stop();
    server.close();
  });
  beforeEach(async () => {
    await Promise.all([User, Classroom, Assignment, Pet, Submission, Cosmetic].map((m) => m.deleteMany({})));
    await Cosmetic.create({ cosmeticId: 1, name: "Skully bow", category: "Head", cost: 230, image: "images/x.png" });
    teacher = await User.create({ name: "profe", email: "p@test.com", passwordHash: "x".repeat(60), role: "teacher" });
    classroom = await Classroom.create({ name: "Salón", teacherId: teacher._id, joinCode: "ABC234", period: { startDate: at(0), endDate: at(60) } });
    await User.updateOne({ _id: teacher._id }, { classroomId: classroom._id });
    student = await User.create({ name: "ana", email: "a@test.com", passwordHash: "x".repeat(60), role: "student", classroomId: classroom._id });
    await Pet.create({ ownerId: student._id, periodId: classroom.period.periodId, coins: 270 });
    const base = { classroomId: classroom._id, periodId: classroom.period.periodId };
    a1 = await Assignment.create({ ...base, title: "Uno", dueAt: at(5) });
    a2 = await Assignment.create({ ...base, title: "Dos", dueAt: at(10) });
  });

  it("hunger comes from server clock on each read", async () => {
    near((await game(0)).dog.hunger, 100);
    near((await game(2.5)).dog.hunger, 50);
    near((await game(4.5)).dog.hunger, 10);
  });

  it("health loss and death are saved and not undone", async () => {
    assert.equal((await game(5.1)).dog.health, 50);
    assert.equal((await petOf()).health, 50);
    let body = await game(11);
    assert.deepEqual([body.dog.health, body.dog.status], [0, "DEAD"]);
    // Entregar después de morir o dejar pasar el tiempo no cambia nada.
    await Submission.create({ assignmentId: a1._id, studentId: student._id, fileName: "a", fileUrl: "https://x.test/a", storageKey: "a" });
    body = await game(500);
    assert.deepEqual([body.dog.health, body.dog.status], [0, "DEAD"]);
    assert.equal((await petOf()).status, "dead");
  });

  it("on-time submission avoids health loss", async () => {
    await Submission.create({ assignmentId: a1._id, studentId: student._id, fileName: "a", fileUrl: "https://x.test/a", storageKey: "a" });
    assert.equal((await game(6)).dog.health, 100);
  });

  it("buying also returns reconciled state", async () => {
    clock.now = () => T0 + 5.1 * DAY;
    const { body } = await call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 1 }).expect(201);
    assert.equal(body.dog.health, 50); // tarea 1 vencida sin entrega
    near(body.dog.hunger, 98); // activa = tarea 2, ventana [día 5, día 10]
    assert.equal(body.student.coins, 40);
  });

  it("student joining late counts already-due tasks as missed (ADR Rev. 2.5)", async () => {
    const late = await User.create({ name: "tarde", email: "t@test.com", passwordHash: "x".repeat(60), role: "student" });
    const as = (path, method = "get") => request(server)[method](path).set("Cookie", [`session=${signToken({ sub: late._id.toString() })}`]);
    clock.now = () => T0 + 7 * DAY; // la tarea 1 (día 5) ya venció; la 2 (día 10) no
    await as("/api/classrooms/join", "post").send({ joinCode: "ABC234" }).expect(201);
    assert.equal((await Pet.findOne({ ownerId: late._id })).health, 100); // nace con 100...
    const body = (await as("/api/me/game").expect(200)).body;
    assert.equal(body.dog.health, 50); // ...y su primera lectura ya refleja la tarea vencida
    assert.equal(body.dog.status, "ALIVE");
    // Si ya habían vencido todas las tareas, nace dead y no se puede restaurar.
    const later = await User.create({ name: "muy-tarde", email: "m@test.com", passwordHash: "x".repeat(60), role: "student" });
    const asLater = (path, method = "get") => request(server)[method](path).set("Cookie", [`session=${signToken({ sub: later._id.toString() })}`]);
    clock.now = () => T0 + 11 * DAY;
    await asLater("/api/classrooms/join", "post").send({ joinCode: "ABC234" }).expect(201);
    const dead = (await asLater("/api/me/game").expect(200)).body;
    assert.deepEqual([dead.dog.status, dead.dog.health], ["DEAD", 0]);
  });

  it("teacher's student list reflects current moment", async () => {
    clock.now = () => T0 + 11 * DAY;
    const { body } = await call(teacher, "get", `/api/classrooms/${classroom._id}/students`).expect(200);
    assert.deepEqual(body.students[0].pet, { status: "dead", health: 0, hunger: 0 });
  });

  const petOf = () => Pet.findOne({ ownerId: student._id });
});

describe("Audit · join classroom rate limit", () => {
  let mongod, server;
  before(async () => {
    mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
    process.env.MONGODB_URI = mongod.getUri();
    await mongoose.connect(mongod.getUri());
    server = app.listen(0);
  });
  after(async () => {
    process.env.NODE_ENV = "test";
    await mongoose.disconnect();
    await mongod.stop();
    server.close();
  });

  it("after 20 attempts, next gets 429 and counter is per student", async () => {
    const mk = (n) => User.create({ name: n, email: `${n}@test.com`, passwordHash: "x".repeat(60), role: "student" });
    const [s1, s2] = [await mk("uno"), await mk("dos")];
    const join = (u, code) =>
      request(server).post("/api/classrooms/join").set("Cookie", [`session=${signToken({ sub: u._id.toString() })}`]).send({ joinCode: code });
    process.env.NODE_ENV = "development"; // limit skipped only in NODE_ENV=test
    for (let i = 0; i < 20; i++) assert.equal((await join(s1, "ZZZZZZ")).status, 404);
    const blocked = await join(s1, "ZZZZZZ");
    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers["retry-after"]);
    assert.equal((await join(s2, "ZZZZZZ")).status, 404); // another student not affected
  });
});
