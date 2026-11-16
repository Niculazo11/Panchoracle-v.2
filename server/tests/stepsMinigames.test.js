// Auditoría (UN-302 / UN-303 sobre UN-108): defectos hallados en el código de pasos y minijuegos.
// Ejecutar con: node --test server/tests/stepsMinigames.test.js

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom, Assignment, Pet, Submission, MinigamePlay } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");
const { clock } = await import("../utils/clock.js");

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-08-01T12:00:00.000Z");
const at = (days) => new Date(T0 + days * DAY);

let mongod, server, teacher, student, classroom, a1, a2;
const call = (user, method, path) =>
  request(server)[method](path).set("Cookie", [`session=${signToken({ sub: user._id.toString() })}`]);
const day = (d) => (clock.now = () => T0 + d * DAY);
const step = (id, task) => call(student, "post", `/api/assignments/${task._id}/steps`).send({ stepId: id });
const game = async () => (await call(student, "get", "/api/me/game").expect(200)).body;
const petOf = () => Pet.findOne({ ownerId: student._id });

before(async () => {
  mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  server = app.listen(0);
});
after(async () => {
  clock.now = () => Date.now();
  delete process.env.MINIGAME_COOLDOWN_MS;
  delete process.env.MINIGAME_MAX_PLAYS_PER_DAY;
  await mongoose.disconnect();
  await mongod.stop();
  server.close();
});
beforeEach(async () => {
  await Promise.all([User, Classroom, Assignment, Pet, Submission, MinigamePlay].map((m) => m.deleteMany({})));
  delete process.env.MINIGAME_COOLDOWN_MS;
  delete process.env.MINIGAME_MAX_PLAYS_PER_DAY;
  teacher = await User.create({ name: "profe", email: "p@test.com", passwordHash: "x".repeat(60), role: "teacher" });
  classroom = await Classroom.create({ name: "Salón", teacherId: teacher._id, joinCode: "ABC234", period: { startDate: at(0), endDate: at(60) } });
  student = await User.create({ name: "ana", email: "a@test.com", passwordHash: "x".repeat(60), role: "student", classroomId: classroom._id });
  await Pet.create({ ownerId: student._id, periodId: classroom.period.periodId, coins: 270 });
  const base = { classroomId: classroom._id, periodId: classroom.period.periodId };
  a1 = await Assignment.create({ ...base, title: "Uno", dueAt: at(5) });
  a2 = await Assignment.create({ ...base, title: "Dos", dueAt: at(10) });
  day(1);
});

describe("Pasos (UN-302)", () => {
  it("el progreso de pasos también se ve en GET /api/me/game", async () => {
    await step(1, a1).expect(200);
    await step(3, a1).expect(200);
    const body = await game();
    assert.deepEqual(body.currentAssignment.steps.map((s) => s.completed), [true, false, true, false]);
  });

  it("un perro que murió por el tiempo ya no puede completar pasos (409)", async () => {
    day(11); // las dos tareas vencidas sin entrega: dead, aunque nadie lo ha leído aún
    assert.equal((await petOf()).status, "alive");
    const res = await step(1, a1).expect(409);
    assert.equal(res.body.error.code, "CONFLICT");
    assert.equal((await petOf()).status, "dead");
  });

  it("los pasos de una tarea incumplida NO pasan a la siguiente tarea", async () => {
    await step(1, a1).expect(200);
    await step(2, a1).expect(200);
    day(6); // a1 venció sin entrega; la activa es a2
    const body = await game();
    assert.equal(body.currentAssignment.id, a2._id.toString());
    assert.ok(body.currentAssignment.steps.every((s) => !s.completed));
    await step(3, a2).expect(200); // empieza de cero en a2
    assert.deepEqual((await game()).currentAssignment.steps.map((s) => s.completed), [false, false, true, false]);
  });

  it("el mismo paso enviado a la vez solo se registra una vez", async () => {
    const results = await Promise.all([1, 2, 3].map(() => step(1, a1)));
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.ok(results.every((r) => [200, 409].includes(r.status)));
    assert.equal((await petOf()).currentAssignmentSteps[0], true);
  });

  it("pasos simultáneos distintos no se pierden entre sí (tras el primero)", async () => {
    await step(1, a1).expect(200);
    await Promise.all([step(2, a1), step(3, a1)]);
    assert.deepEqual([...(await petOf()).currentAssignmentSteps], [true, true, true, false]);
  });

  it("entregar pone el hambre en 100 y la reconciliación no lo contradice", async () => {
    for (const id of [1, 2, 3]) await step(id, a1).expect(200);
    day(3);
    const res = await call(student, "post", `/api/assignments/${a1._id}/submit`).expect(200);
    assert.equal(res.body.state.dog.hunger, 100);
    assert.equal(res.body.state.currentAssignment.id, a2._id.toString());
    day(5.5); // a1 venció pero estaba entregada: sin pérdida de salud
    assert.equal((await game()).dog.health, 100);
  });
});

describe("Minijuegos (UN-303, tope hasta UN-501)", () => {
  const reward = (count = 5) => call(student, "post", "/api/minigames/reward").send({ correctCount: count });

  it("suma como máximo 5 monedas por partida", async () => {
    const res = await reward(999).expect(200);
    assert.equal(res.body.student.coins, 275);
    const plays = await MinigamePlay.find({ studentId: student._id });
    assert.deepEqual([plays.length, plays[0].reward, plays[0].gameId], [1, 5, "quiz"]);
  });

  it("no se puede repetir al instante: 429 durante el enfriamiento y no se cobra", async () => {
    await reward(3).expect(200);
    const res = await reward(5).expect(429);
    assert.equal(res.body.error.code, "RATE_LIMITED");
    assert.equal((await petOf()).coins, 273);
    day(1 + 31 / 86400); // pasan 31 s
    await reward(5).expect(200);
    assert.equal((await petOf()).coins, 278);
  });

  it("peticiones simultáneas: solo una cobra", async () => {
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => reward(5)));
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.equal((await petOf()).coins, 275);
  });

  it("tope diario: la partida 11 del día recibe 429; al día siguiente vuelve a funcionar", async () => {
    process.env.MINIGAME_COOLDOWN_MS = "0";
    for (let i = 0; i < 10; i++) {
      clock.now = () => T0 + i * 1000; // 10 partidas el mismo día (UTC)
      await reward(5).expect(200);
    }
    clock.now = () => T0 + 11_000;
    await reward(5).expect(429);
    assert.equal((await petOf()).coins, 270 + 50);
    clock.now = () => T0 + DAY;
    await reward(5).expect(200);
  });

  it("valida el cuerpo y bloquea a profesores", async () => {
    for (const body of [{}, { correctCount: 0 }, { correctCount: "5" }, { correctCount: { $gt: 0 } }, { correctCount: 5, coins: 99 }]) {
      await call(student, "post", "/api/minigames/reward").send(body).expect(400);
    }
    await call(teacher, "post", "/api/minigames/reward").send({ correctCount: 5 }).expect(403);
    assert.equal((await petOf()).coins, 270);
  });
});
