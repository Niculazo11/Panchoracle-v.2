// UN-107 · Pruebas de integración de la API de tareas (/api/assignments)
// Ejecutar con: node --test server/tests/assignments.test.js   (usa node:test + mongodb-memory-server)

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom, Assignment } = await import("../models/index.js");
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
  it("el profesor crea una tarea y el contador del periodo sube", async () => {
    const res = await as(teacher, "post", "/").send({ title: "Taller 1", description: "Ejercicios 1-5", dueAt: iso(20) }).expect(201);
    assert.equal(res.body.assignment.title, "Taller 1");
    assert.equal(res.body.assignment.classroomId, classroom._id.toString());
    assert.equal(res.body.assignment.periodId, classroom.period.periodId.toString());
    assert.equal((await Classroom.findById(classroom._id)).period.totalAssignments, 1);
  });

  it("un estudiante recibe 403; sin sesión 401", async () => {
    await as(student, "post", "/").send({ title: "X", dueAt: iso(20) }).expect(403);
    await as(null, "post", "/").send({ title: "X", dueAt: iso(20) }).expect(401);
  });

  it("valida fechas: formato, fuera del periodo y duplicada", async () => {
    await as(teacher, "post", "/").send({ title: "X", dueAt: "mañana" }).expect(400);
    await as(teacher, "post", "/").send({ title: "X", dueAt: iso(5) }).expect(400); // before startDate
    await as(teacher, "post", "/").send({ title: "X", dueAt: iso(200) }).expect(400); // after endDate
    await as(teacher, "post", "/").send({ title: "A", dueAt: iso(20) }).expect(201);
    const dup = await as(teacher, "post", "/").send({ title: "B", dueAt: iso(20) }).expect(409);
    assert.equal(dup.body.error.code, "CONFLICT");
  });

  it("rechaza objetos NoSQL, campos desconocidos y títulos vacíos", async () => {
    await as(teacher, "post", "/").send({ title: { $ne: null }, dueAt: iso(20) }).expect(400);
    await as(teacher, "post", "/").send({ title: "X", dueAt: iso(20), classroomId: "1" }).expect(400);
    await as(teacher, "post", "/").send({ title: "   ", dueAt: iso(20) }).expect(400);
  });

  it("un título con <script> se guarda como texto y se devuelve intacto", async () => {
    const title = "<script>alert(1)</script>";
    const created = await as(teacher, "post", "/").send({ title, dueAt: iso(20) }).expect(201);
    assert.equal(created.body.assignment.title, title);
    const read = await as(teacher, "get", `/${created.body.assignment.id}`).expect(200);
    assert.equal(read.body.assignment.title, title);
  });

  it("con el periodo ya iniciado responde 409 PERIOD_LOCKED", async () => {
    await Classroom.updateOne({ _id: classroom._id }, { "period.startDate": new Date(Date.now() - DAY) });
    const res = await as(teacher, "post", "/").send({ title: "X", dueAt: iso(20) }).expect(409);
    assert.equal(res.body.error.code, "PERIOD_LOCKED");
  });
});

describe("UN-107 · lectura (GET)", () => {
  it("estudiante inscrito y profesor leen la lista ordenada por dueAt", async () => {
    await as(teacher, "post", "/").send({ title: "Segunda", dueAt: iso(30) }).expect(201);
    await as(teacher, "post", "/").send({ title: "Primera", dueAt: iso(20) }).expect(201);
    for (const user of [teacher, student]) {
      const res = await as(user, "get", "/").expect(200);
      assert.deepEqual(res.body.assignments.map((a) => a.title), ["Primera", "Segunda"]);
    }
  });

  it("un estudiante sin salón recibe 404; con id ajeno 403; id inválido 400; inexistente 404", async () => {
    const created = await as(teacher, "post", "/").send({ title: "A", dueAt: iso(20) }).expect(201);
    const id = created.body.assignment.id;
    await as(outsider, "get", "/").expect(404);
    await as(outsider, "get", `/${id}`).expect(403);
    await as(otherTeacher, "get", `/${id}`).expect(403);
    await as(teacher, "get", "/nope").expect(400);
    await as(teacher, "get", `/${new mongoose.Types.ObjectId()}`).expect(404);
  });
});

describe("UN-107 · PATCH y DELETE", () => {
  let id;
  beforeEach(async () => {
    const res = await as(teacher, "post", "/").send({ title: "A", dueAt: iso(20) });
    id = res.body.assignment.id;
  });

  it("el profesor dueño edita; el estudiante y el profesor ajeno reciben 403", async () => {
    const res = await as(teacher, "patch", `/${id}`).send({ title: "Nuevo", dueAt: iso(25) }).expect(200);
    assert.equal(res.body.assignment.title, "Nuevo");
    await as(student, "patch", `/${id}`).send({ title: "Hack" }).expect(403);
    await as(otherTeacher, "patch", `/${id}`).send({ title: "Hack" }).expect(403);
    await as(student, "delete", `/${id}`).expect(403);
    await as(otherTeacher, "delete", `/${id}`).expect(403);
    assert.equal((await Assignment.findById(id)).title, "Nuevo");
  });

  it("PATCH valida: vacío, fecha fuera del periodo y fecha duplicada", async () => {
    await as(teacher, "patch", `/${id}`).send({}).expect(400);
    await as(teacher, "patch", `/${id}`).send({ dueAt: iso(5) }).expect(400);
    await as(teacher, "post", "/").send({ title: "B", dueAt: iso(30) }).expect(201);
    await as(teacher, "patch", `/${id}`).send({ dueAt: iso(30) }).expect(409);
  });

  it("DELETE borra la tarea y baja el contador", async () => {
    assert.equal((await Classroom.findById(classroom._id)).period.totalAssignments, 1);
    await as(teacher, "delete", `/${id}`).expect(200);
    assert.equal(await Assignment.countDocuments({}), 0);
    assert.equal((await Classroom.findById(classroom._id)).period.totalAssignments, 0);
    await as(teacher, "delete", `/${id}`).expect(404);
  });

  it("con el periodo iniciado, PATCH y DELETE responden 409 PERIOD_LOCKED y no cambian nada", async () => {
    await Classroom.updateOne({ _id: classroom._id }, { "period.startDate": new Date(Date.now() - DAY) });
    const patch = await as(teacher, "patch", `/${id}`).send({ title: "Tarde" }).expect(409);
    assert.equal(patch.body.error.code, "PERIOD_LOCKED");
    await as(teacher, "delete", `/${id}`).expect(409);
    assert.equal((await Assignment.findById(id)).title, "A");
  });
});
