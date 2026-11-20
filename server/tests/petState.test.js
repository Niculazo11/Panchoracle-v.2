// UN-108 · Hambre y salud calculadas en servidor, con reloj simulado.
// Hambre = cuenta regresiva hasta dueAt. Salud = -10 UNA vez por tarea vencida sin entrega.
// Parte 1: función pura (sin base de datos). Parte 2: integración con MongoDB.
// Ejecutar con: node --test server/tests/petState.test.js

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
// Every task is created at the period start, so its countdown runs from day 0 to its due day.
const tasks = (...days) => days.map((d, i) => ({ id: `a${i + 1}`, dueAt: at(d), createdAt: at(0) }));
const run = (days, { assignments, submitted = [], penalized = [], pet = fresh }) =>
  computePetState({
    pet,
    period,
    assignments,
    submittedIds: new Set(submitted),
    penalizedIds: new Set(penalized),
    now: T0 + days * DAY,
  });
const pick = ({ health, hunger, status }) => ({ health, hunger, status });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`);

describe("UN-108 · computePetState (reloj simulado)", () => {
  const five = tasks(5);

  it("el hambre baja linealmente hasta la fecha límite", () => {
    for (const [day, hunger] of [[0, 100], [1.25, 75], [2.5, 50], [3.75, 25], [5, 0]]) {
      near(run(day, { assignments: five }).hunger, hunger);
    }
  });

  it("antes de empezar el periodo todo está al máximo", () => {
    const state = computePetState({ pet: fresh, period, assignments: five, submittedIds: new Set(), now: T0 - DAY });
    assert.deepEqual(pick(state), fresh);
  });

  it("la cuenta regresiva empieza en createdAt, pero nunca antes del inicio del periodo", () => {
    const later = [{ id: "a1", dueAt: at(6), createdAt: at(2) }];
    near(run(4, { assignments: later }).hunger, 50); // mitad de [2, 6]
    const early = [{ id: "a1", dueAt: at(5), createdAt: at(-3) }];
    near(run(2.5, { assignments: early }).hunger, 50); // mitad de [0, 5]
  });

  it("con varias tareas pendientes sigue la fecha límite más cercana", () => {
    const two = tasks(5, 15);
    near(run(3, { assignments: two }).hunger, 40); // a1: 2 de 5 días
    near(run(3, { assignments: two, submitted: ["a1"] }).hunger, 80); // a2: 12 de 15 días
    near(run(10, { assignments: two, submitted: ["a1"] }).hunger, 100 / 3); // a2: 5 de 15 días
  });

  it("con todas las tareas entregadas el hambre vuelve a 100", () => {
    const two = tasks(5, 15);
    assert.equal(run(3, { assignments: two, submitted: ["a1", "a2"] }).hunger, 100);
    assert.equal(run(30, { assignments: two, submitted: ["a1", "a2"] }).hunger, 100);
  });

  it("vencida sin entrega y nada más abierto: hambre 0", () => {
    const two = tasks(5, 10);
    assert.equal(run(11, { assignments: two, submitted: ["a1"], penalized: ["a2"], pet: { ...fresh, health: 90 } }).hunger, 0);
    assert.equal(run(5, { assignments: five }).hunger, 0); // justo en dueAt
  });

  it("la salud baja 10 UNA vez por tarea vencida sin entrega", () => {
    const three = tasks(5, 10, 15);
    assert.equal(run(4.9, { assignments: three }).health, 100);
    assert.equal(run(5.1, { assignments: three }).health, 90);
    assert.deepEqual(run(5.1, { assignments: three }).newlyPenalized, ["a1"]);
    assert.equal(run(10.1, { assignments: three }).health, 80); // dos tareas falladas
    assert.equal(run(5.1, { assignments: three, submitted: ["a1"] }).health, 100);
  });

  it("es idempotente: una tarea ya penalizada no vuelve a restar", () => {
    const three = tasks(5, 10, 15);
    const once = run(5.1, { assignments: three });
    const again = run(7, { assignments: three, penalized: once.newlyPenalized, pet: { ...fresh, ...pick(once) } });
    assert.equal(again.health, 90);
    assert.deepEqual(again.newlyPenalized, []);
    const second = run(10.1, { assignments: three, penalized: ["a1"], pet: { ...fresh, health: 90 } });
    assert.deepEqual([second.health, second.newlyPenalized], [80, ["a2"]]);
  });

  it("la salud no decae con el tiempo: entre vencimientos no cambia", () => {
    const list = tasks(5, 20);
    const pet = { ...fresh, health: 90 };
    for (const d of [5.1, 8, 12, 19.9]) assert.equal(run(d, { assignments: list, penalized: ["a1"], pet }).health, 90);
  });

  it("entregar no cambia la salud (solo recalcula el hambre)", () => {
    const list = tasks(5, 10);
    const pet = { ...fresh, health: 90 };
    const before = run(7, { assignments: list, penalized: ["a1"], pet });
    const after = run(7, { assignments: list, penalized: ["a1"], submitted: ["a2"], pet });
    assert.equal(after.health, before.health);
    assert.equal(after.hunger, 100);
  });

  it("sin tareas en el periodo: 100 y 100", () => {
    assert.deepEqual(pick(run(30, { assignments: [] })), fresh);
  });

  it("10 tareas falladas: salud 0 y estado dead; con 9 sigue vivo", () => {
    const ten = tasks(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    assert.deepEqual(pick(run(10.5, { assignments: ten })), { health: 0, hunger: 0, status: "dead" });
    assert.deepEqual([run(9.5, { assignments: ten }).health, run(9.5, { assignments: ten }).status], [10, "alive"]);
  });

  it("ausencia larga = mismo resultado que seguir conectado", () => {
    const list = tasks(5, 10, 15, 20);
    let state = { pet: fresh, penalized: [] };
    for (let d = 0; d <= 12; d += 0.5) {
      const next = run(d, { assignments: list, pet: state.pet, penalized: state.penalized });
      state = { pet: pick(next), penalized: [...state.penalized, ...next.newlyPenalized] };
    }
    assert.deepEqual(state.pet, pick(run(12, { assignments: list })));
  });

  it("un perro DEAD no vuelve a cambiar, ni con entregas ni con el tiempo", () => {
    const dead = { health: 0, hunger: 0, status: "dead" };
    const list = tasks(5, 10);
    for (const d of [0, 7, 100]) {
      const state = run(d, { assignments: list, submitted: ["a1", "a2"], pet: dead });
      assert.deepEqual(pick(state), dead);
      assert.deepEqual(state.newlyPenalized, []);
    }
  });
});

describe("UN-108 · integración (API + MongoDB, reloj simulado)", () => {
  let mongod, server, teacher, student, classroom, a1, a2;
  const call = (user, method, path) =>
    request(server)[method](path).set("Cookie", [`session=${signToken({ sub: user._id.toString() })}`]);
  const game = async (days) => {
    clock.now = () => T0 + days * DAY;
    return (await call(student, "get", "/api/me/game").expect(200)).body;
  };
  const petOf = () => Pet.findOne({ ownerId: student._id });
  const base = () => ({ classroomId: classroom._id, periodId: classroom.period.periodId, createdAt: at(0) });

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
    a1 = await Assignment.create({ ...base(), title: "Uno", dueAt: at(5) });
    a2 = await Assignment.create({ ...base(), title: "Dos", dueAt: at(10) });
  });

  it("el hambre sale del reloj del servidor en cada lectura", async () => {
    near((await game(0)).dog.hunger, 100);
    near((await game(2.5)).dog.hunger, 50);
    near((await game(4.5)).dog.hunger, 10);
  });

  it("el -10 por tarea vencida se cobra una sola vez aunque se lea muchas veces", async () => {
    let body = await game(5.1);
    assert.equal(body.dog.health, 90);
    near(body.dog.hunger, 49); // activa = tarea 2, ventana [día 0, día 10]
    for (const d of [5.1, 5.2, 6, 9]) assert.equal((await game(d)).dog.health, 90);
    const pet = await petOf();
    assert.equal(pet.health, 90);
    assert.equal(pet.penalizedAssignments.length, 1);
    body = await game(10.1);
    assert.deepEqual([body.dog.health, body.dog.status], [80, "ALIVE"]);
  });

  it("lecturas simultáneas tampoco cobran dos veces", async () => {
    clock.now = () => T0 + 5.1 * DAY;
    const results = await Promise.all([1, 2, 3, 4].map(() => call(student, "get", "/api/me/game")));
    for (const res of results) assert.equal(res.status, 200);
    assert.equal((await petOf()).health, 90);
    assert.equal((await petOf()).penalizedAssignments.length, 1);
  });

  it("la muerte se guarda y no se deshace", async () => {
    for (let d = 11; d <= 18; d++) await Assignment.create({ ...base(), title: `T${d}`, dueAt: at(d) });
    const body = await game(19); // 10 tareas vencidas sin entrega
    assert.deepEqual([body.dog.health, body.dog.status], [0, "DEAD"]);
    assert.equal((await petOf()).status, "dead");
    await Submission.create({ assignmentId: a1._id, studentId: student._id, fileName: "a", fileUrl: "https://x.test/a", storageKey: "a" });
    const later = await game(500);
    assert.deepEqual([later.dog.health, later.dog.status], [0, "DEAD"]);
  });

  it("una entrega a tiempo evita la pérdida de salud", async () => {
    await Submission.create({ assignmentId: a1._id, studentId: student._id, fileName: "a", fileUrl: "https://x.test/a", storageKey: "a" });
    const body = await game(6);
    assert.equal(body.dog.health, 100);
    near(body.dog.hunger, 40); // tarea 2: 4 de 10 días
  });

  it("entregar por el flujo de tareas recalcula el hambre y deja la salud igual", async () => {
    await Pet.updateOne({ ownerId: student._id }, { $set: { health: 80 } });
    clock.now = () => T0 + 1 * DAY;
    near((await game(1)).dog.hunger, 80); // tarea 1: 4 de 5 días
    await call(student, "post", `/api/assignments/${a1._id}/submissions`).send({ kind: "link", url: "https://x.test/a" }).expect(201);
    let body = await game(1);
    near(body.dog.hunger, 90); // ahora sigue la fecha de la tarea 2
    assert.equal(body.dog.health, 80);
    near((await petOf()).hunger, 90);
    await call(student, "post", `/api/assignments/${a2._id}/submissions`).send({ kind: "link", url: "https://x.test/b" }).expect(201);
    body = await game(1);
    assert.deepEqual([body.dog.hunger, body.dog.health], [100, 80]);
  });

  it("comprar también devuelve el estado reconciliado", async () => {
    clock.now = () => T0 + 5.1 * DAY;
    const { body } = await call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 1 }).expect(201);
    assert.equal(body.dog.health, 90); // tarea 1 vencida sin entrega
    near(body.dog.hunger, 49);
    assert.equal(body.student.coins, 40);
  });

  it("un estudiante que se une tarde paga las tareas ya vencidas (ADR Rev. 2.5)", async () => {
    const late = await User.create({ name: "tarde", email: "t@test.com", passwordHash: "x".repeat(60), role: "student" });
    const as = (path, method = "get") => request(server)[method](path).set("Cookie", [`session=${signToken({ sub: late._id.toString() })}`]);
    clock.now = () => T0 + 7 * DAY; // la tarea 1 (día 5) ya venció; la 2 (día 10) no
    await as("/api/classrooms/join", "post").send({ joinCode: "ABC234" }).expect(201);
    assert.equal((await Pet.findOne({ ownerId: late._id })).health, 100); // nace con 100...
    let body = (await as("/api/me/game").expect(200)).body;
    assert.equal(body.dog.health, 90); // ...y su primera lectura ya refleja la tarea vencida
    clock.now = () => T0 + 11 * DAY;
    body = (await as("/api/me/game").expect(200)).body;
    assert.deepEqual([body.dog.health, body.dog.status], [80, "ALIVE"]);
  });

  it("la lista de estudiantes del profesor refleja el momento actual", async () => {
    clock.now = () => T0 + 11 * DAY;
    const { body } = await call(teacher, "get", `/api/classrooms/${classroom._id}/students`).expect(200);
    assert.deepEqual(body.students[0].pet, { status: "alive", health: 80, hunger: 0 });
  });
});

describe("Auditoría · rate limit de unirse a un salón", () => {
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

  it("tras 20 intentos, el siguiente recibe 429 y el contador es por estudiante", async () => {
    const mk = (n) => User.create({ name: n, email: `${n}@test.com`, passwordHash: "x".repeat(60), role: "student" });
    const [s1, s2] = [await mk("uno"), await mk("dos")];
    const join = (u, code) =>
      request(server).post("/api/classrooms/join").set("Cookie", [`session=${signToken({ sub: u._id.toString() })}`]).send({ joinCode: code });
    process.env.NODE_ENV = "development"; // el límite se omite solo en NODE_ENV=test
    for (let i = 0; i < 20; i++) assert.equal((await join(s1, "ZZZZZZ")).status, 404);
    const blocked = await join(s1, "ZZZZZZ");
    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers["retry-after"]);
    assert.equal((await join(s2, "ZZZZZZ")).status, 404); // otro estudiante no se ve afectado
  });
});