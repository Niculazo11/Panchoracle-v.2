// UN-108 [ADR Rev. 2.3] · El profesor perdona puntos de salud de un Pancho VIVO.
// POST /api/classrooms/:id/students/:studentId/restore-health
// Ejecutar con: node --test server/tests/restoreHealth.test.js

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
const { clock } = await import("../utils/clock.js");

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-08-01T00:00:00.000Z");
const at = (days) => new Date(T0 + days * DAY);

let mongod, server, teacher, other, student, classroom;

const call = (user, method, path) =>
  request(server)[method](path).set("Cookie", [`session=${signToken({ sub: user._id.toString() })}`]);
const day = (d) => (clock.now = () => T0 + d * DAY);
const restore = (user, body, studentId = student._id, classroomId = classroom._id) =>
  call(user, "post", `/api/classrooms/${classroomId}/students/${studentId}/restore-health`).send(body);
const game = async () => (await call(student, "get", "/api/me/game").expect(200)).body;
const petOf = () => Pet.findOne({ ownerId: student._id });
const mkUser = (name, role, classroomId = null) =>
  User.create({ name, email: `${name}@test.com`, passwordHash: "x".repeat(60), role, classroomId });

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
  await Promise.all([User, Classroom, Assignment, Pet, Submission].map((m) => m.deleteMany({})));
  teacher = await mkUser("profe", "teacher");
  other = await mkUser("profe2", "teacher");
  classroom = await Classroom.create({ name: "Salón", teacherId: teacher._id, joinCode: "ABC234", period: { startDate: at(0), endDate: at(60) } });
  await User.updateOne({ _id: teacher._id }, { classroomId: classroom._id });
  student = await mkUser("ana", "student", classroom._id);
  await Pet.create({ ownerId: student._id, periodId: classroom.period.periodId, coins: 270 });
  const base = { classroomId: classroom._id, periodId: classroom.period.periodId };
  for (const d of [1, 2, 3, 4, 5]) await Assignment.create({ ...base, title: `T${d}`, dueAt: at(d) }); // 20 puntos cada una
});

describe("restore-health · reglas", () => {
  it("devuelve los 20 puntos perdidos por una tarea (80 → 100) y lo registra", async () => {
    assert.equal((await (day(1.5), game())).dog.health, 80);
    const res = await restore(teacher, { points: 20, reason: "Excusa médica" }).expect(200);
    assert.equal(res.body.restored, 20);
    assert.deepEqual([res.body.pet.status, res.body.pet.health, res.body.pet.healthAdjustment], ["alive", 100, 20]);
    assert.equal((await game()).dog.health, 100);
    const log = (await petOf()).healthRestoreLog;
    assert.equal(log.length, 1);
    assert.deepEqual([log[0].points, log[0].healthBefore, log[0].healthAfter, log[0].reason], [20, 80, 100, "Excusa médica"]);
    assert.equal(log[0].teacherId.toString(), teacher._id.toString());
  });

  it("la reconciliación automática NO pisa la restauración, y las tareas nuevas siguen restando", async () => {
    day(2.5);
    assert.equal((await game()).dog.health, 60);
    await restore(teacher, { points: 20, reason: "Enfermedad" }).expect(200);
    for (const d of [2.5, 2.6, 2.9]) assert.equal((day(d), (await game()).dog.health), 80); // leer muchas veces no cambia nada
    assert.equal((await (day(3.5), game())).dog.health, 60); // 3 falladas: 100 - 60 + 20 = 60
    assert.equal((await petOf()).healthAdjustment, 20);
  });

  it("sin points restaura todo lo perdido; con points menor, solo esa parte", async () => {
    day(3.5); // 3 falladas: salud 40
    let res = await restore(teacher, { points: 10, reason: "Parcial" }).expect(200);
    assert.equal(res.body.pet.health, 50);
    res = await restore(teacher, { reason: "Todo el resto" }).expect(200);
    assert.deepEqual([res.body.restored, res.body.pet.health], [50, 100]);
    assert.equal((await petOf()).healthRestoreLog.length, 2);
  });

  it("nunca supera 100: pedir más de lo perdido o restaurar con salud completa da 409 y no cambia nada", async () => {
    day(1.5); // salud 80
    const over = await restore(teacher, { points: 30, reason: "Demasiado" }).expect(409);
    assert.equal(over.body.error.code, "CONFLICT");
    day(0.5); // salud 100
    await restore(teacher, { points: 5, reason: "Nada que restaurar" }).expect(409);
    await restore(teacher, { reason: "Nada que restaurar" }).expect(409);
    const pet = await petOf();
    assert.deepEqual([pet.healthAdjustment, pet.healthRestoreLog.length], [0, 0]);
  });

  it("un Pancho muerto NO se restaura ni aunque la salud ya esté guardada en 0", async () => {
    day(6); // las 5 falladas: dead
    const res = await restore(teacher, { points: 20, reason: "Muy tarde" }).expect(409);
    assert.match(res.body.error.message, /dead/i);
    day(0.5); // aunque el reloj "vuelva atrás", dead es terminal
    await restore(teacher, { reason: "Intento" }).expect(409);
    const body = await game();
    assert.deepEqual([body.dog.status, body.dog.health], ["DEAD", 0]);
    assert.equal((await petOf()).healthAdjustment, 0);
  });

  it("si murió desde la última lectura, la restauración lo detecta y se niega", async () => {
    clock.now = () => T0 + 6 * DAY; // nadie ha leído a Pancho: en BD sigue alive con 100
    assert.equal((await petOf()).status, "alive");
    await restore(teacher, { reason: "Intento tardío" }).expect(409);
    assert.equal((await petOf()).status, "dead");
  });

  it("dos restauraciones simultáneas no se acumulan sobre el mismo estado", async () => {
    day(2.5); // salud 60, 40 perdidos
    const results = await Promise.all([1, 2, 3].map(() => restore(teacher, { reason: "Doble clic" })));
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.equal((await petOf()).healthAdjustment, 40);
    assert.equal((await game()).dog.health, 100);
  });
});

describe("restore-health · permisos y validación", () => {
  it("solo el profesor dueño: estudiante 403, profesor ajeno 403, sin sesión 401", async () => {
    day(1.5);
    await restore(student, { reason: "Yo mismo" }).expect(403);
    await restore(other, { reason: "Ajeno" }).expect(403);
    await request(server).post(`/api/classrooms/${classroom._id}/students/${student._id}/restore-health`).send({ reason: "x y z" }).expect(401);
    assert.equal((await petOf()).healthAdjustment, 0);
  });

  it("estudiante de otro salón o inexistente: 404; salón inexistente: 404; id inválido: 400", async () => {
    day(1.5);
    const stranger = await mkUser("beto", "student");
    await restore(teacher, { reason: "Ajeno" }, stranger._id).expect(404);
    await restore(teacher, { reason: "Nadie" }, new mongoose.Types.ObjectId()).expect(404);
    await restore(teacher, { reason: "Sin salón" }, student._id, new mongoose.Types.ObjectId()).expect(404);
    await restore(teacher, { reason: "Id malo" }, "nope").expect(400);
  });

  it("valida el cuerpo: reason obligatoria, points positivos y ≤ 100, sin claves extra ni objetos", async () => {
    day(1.5);
    for (const body of [{}, { reason: "ab" }, { points: 0, reason: "Cero" }, { points: -5, reason: "Neg" },
      { points: 101, reason: "Mucho" }, { points: "20", reason: "Texto" }, { points: { $gt: 0 }, reason: "Obj" },
      { reason: "Ok ok", health: 100 }, { reason: { $ne: null } }]) {
      await restore(teacher, body).expect(400);
    }
    assert.equal((await petOf()).healthAdjustment, 0);
  });

  it("un nuevo periodo reinicia el ajuste (ciclo nuevo)", async () => {
    day(1.5);
    await restore(teacher, { reason: "Excusa" }).expect(200);
    const { joinClassroom } = await import("../services/classroomService.js");
    const newPeriod = new mongoose.Types.ObjectId();
    await Classroom.updateOne({ _id: classroom._id }, { "period.periodId": newPeriod });
    await joinClassroom(student, "ABC234");
    const pet = await petOf();
    assert.deepEqual([pet.healthAdjustment, pet.health], [0, 100]);
  });
});
