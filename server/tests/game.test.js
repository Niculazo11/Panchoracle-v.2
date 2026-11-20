// UN-301 · Integration tests for game state (/api/me/game, /api/cosmetics, /api/pets/me/*)
// Run with: node --test server/tests/game.test.js   (uses node:test + mongodb-memory-server)
// Cases reflect client rules (src/state/actions/pancho.js and shop.js).

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom, Assignment, Pet, Cosmetic, Submission } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");

const CATALOG = JSON.parse(readFileSync(new URL("../../src/data/dataset.json", import.meta.url), "utf8"));
const DAY = 24 * 60 * 60 * 1000;
const IMG = "https://images.dog.ceo/breeds/dachshund/n02085620_10074.jpg";

let mongod, server, teacher, student, classroom;

const call = (user, method, path) => {
  const req = request(server)[method](path);
  return user ? req.set("Cookie", [`session=${signToken({ sub: user._id.toString() })}`]) : req;
};
const petOf = (user) => Pet.findOne({ ownerId: user._id });

before(async () => {
  mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  server = app.listen(0);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  server.close();
});

beforeEach(async () => {
  await Promise.all([User, Classroom, Assignment, Pet, Cosmetic, Submission].map((model) => model.deleteMany({})));
  await Cosmetic.insertMany(CATALOG.map((c) => ({ cosmeticId: c.id, name: c.name, category: c.category, cost: c.cost, image: c.image })));
  teacher = await User.create({ name: "profe", email: "profe@test.com", passwordHash: "x".repeat(60), role: "teacher" });
  classroom = await Classroom.create({
    name: "Salón",
    teacherId: teacher._id,
    joinCode: "ABC234",
    period: { startDate: new Date(Date.now() - 5 * DAY), endDate: new Date(Date.now() + 60 * DAY) },
  });
  student = await User.create({ name: "ana", email: "ana@test.com", passwordHash: "x".repeat(60), role: "student", classroomId: classroom._id });
  await Pet.create({ ownerId: student._id, periodId: classroom.period.periodId, coins: 270 });
});

describe("UN-301 · GET /api/me/game", () => {
  it("returns { student, dog, currentAssignment } with client shape", async () => {
    const { body } = await call(student, "get", "/api/me/game").expect(200);
    assert.deepEqual(body.student, { id: "ana", userId: student._id.toString(), coins: 270, inventory: [], assignmentsCompleted: 0 });
    assert.deepEqual(body.dog, {
      id: null, name: "Pancho", imgUrl: null, health: 100, hunger: 100, status: "ALIVE",
      equippedCosmetics: { head: null, face: null, neck: null, body: null },
    });
    assert.equal(body.currentAssignment.id, "000000000000000000000001"); // no assignments: default task
    assert.equal(body.currentAssignment.steps.length, 4);
    assert.ok(body.currentAssignment.steps.every((s) => s.completed === false));
  });

  it("uses classroom's active assignment (ADR 5.3) and skips already submitted", async () => {
    const first = await Assignment.create({ classroomId: classroom._id, periodId: classroom.period.periodId, title: "Primera", dueAt: new Date(Date.now() + 2 * DAY) });
    const second = await Assignment.create({ classroomId: classroom._id, periodId: classroom.period.periodId, title: "Segunda", dueAt: new Date(Date.now() + 9 * DAY) });
    await Assignment.create({ classroomId: classroom._id, periodId: classroom.period.periodId, title: "Vencida", dueAt: new Date(Date.now() - DAY) });
    let body = (await call(student, "get", "/api/me/game").expect(200)).body;
    assert.equal(body.currentAssignment.title, "Primera");
    assert.equal(body.currentAssignment.id, first._id.toString());

    await Submission.create({ assignmentId: first._id, studentId: student._id, fileName: "a.pdf", fileUrl: "https://x.test/a", storageKey: "a" });
    body = (await call(student, "get", "/api/me/game").expect(200)).body;
    assert.equal(body.currentAssignment.id, second._id.toString());
    assert.equal(body.student.assignmentsCompleted, 1);
  });

  it("teacher 403, no session 401, student without classroom (no Pancho) 404", async () => {
    await call(teacher, "get", "/api/me/game").expect(403);
    await call(null, "get", "/api/me/game").expect(401);
    const loose = await User.create({ name: "beto", email: "beto@test.com", passwordHash: "x".repeat(60), role: "student" });
    await call(loose, "get", "/api/me/game").expect(404);
  });
});

describe("UN-301 · GET /api/cosmetics", () => {
  it("delivers catalog from cosmetics collection, with client fields", async () => {
    const { body } = await call(student, "get", "/api/cosmetics").expect(200);
    assert.equal(body.cosmetics.length, CATALOG.length);
    assert.deepEqual(body.cosmetics[0], CATALOG[0]);
    await Cosmetic.updateOne({ cosmeticId: 1 }, { cost: 999 });
    assert.equal((await call(student, "get", "/api/cosmetics")).body.cosmetics[0].cost, 999);
    await call(null, "get", "/api/cosmetics").expect(401);
  });
});

describe("UN-301 · PUT /api/pets/me/pancho (adopt)", () => {
  it("saves chosen Pancho", async () => {
    const { body } = await call(student, "put", "/api/pets/me/pancho").send({ panchoId: "n02085620_10074", imgUrl: IMG }).expect(200);
    assert.equal(body.dog.id, "n02085620_10074");
    assert.equal(body.dog.imgUrl, IMG);
    assert.equal(body.dog.health, 100);
  });

  it("never revives or heals: dead or injured Pancho keeps its state", async () => {
    await Pet.updateOne({ ownerId: student._id }, { status: "dead", health: 0, hunger: 0 });
    const { body } = await call(student, "put", "/api/pets/me/pancho").send({ panchoId: "otro", imgUrl: IMG }).expect(200);
    assert.deepEqual([body.dog.status, body.dog.health, body.dog.hunger], ["DEAD", 0, 0]);
  });

  it("rejects non-dog.ceo images, weird ids, objects, and extra keys", async () => {
    const bad = [
      { panchoId: "a", imgUrl: "https://evil.test/a.jpg" },
      { panchoId: "a", imgUrl: "http://images.dog.ceo/a.jpg" },
      { panchoId: "a b", imgUrl: IMG },
      { panchoId: { $ne: null }, imgUrl: IMG },
      { panchoId: "a", imgUrl: IMG, coins: 9999 },
      { imgUrl: IMG },
    ];
    for (const body of bad) await call(student, "put", "/api/pets/me/pancho").send(body).expect(400);
    assert.equal((await petOf(student)).imgUrl, null);
  });
});

describe("UN-301 · POST /api/pets/me/inventory (buy)", () => {
  it("buy: deducts cost and adds cosmetic (270 - 230 = 40)", async () => {
    const { body } = await call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 1 }).expect(201);
    assert.equal(body.student.coins, 40);
    assert.deepEqual(body.student.inventory, [1]);
  });

  it("no balance, duplicate, or nonexistent: error and nothing changes", async () => {
    await call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 17 }).expect(409); // costs 777
    let pet = await petOf(student);
    assert.deepEqual([pet.coins, pet.inventory.length], [270, 0]);

    await call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 2 }).expect(201); // 200 coins
    const dup = await call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 2 }).expect(409);
    assert.equal(dup.body.error.message, "You already own that cosmetic.");
    await call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 999 }).expect(404);
    pet = await petOf(student);
    assert.deepEqual([pet.coins, [...pet.inventory]], [70, [2]]);
  });

  it("messages same as client: insufficient balance", async () => {
    const res = await call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 18 }).expect(409);
    assert.equal(res.body.error.message, "Not enough coins.");
  });

  it("two simultaneous purchases of same cosmetic: only one charged", async () => {
    const results = await Promise.all([1, 2, 3, 4].map(() => call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: 2 })));
    assert.equal(results.filter((r) => r.status === 201).length, 1);
    const pet = await petOf(student);
    assert.deepEqual([pet.coins, [...pet.inventory]], [70, [2]]);
  });

  it("two different simultaneous purchases without balance for both: balance never negative", async () => {
    const results = await Promise.all([2, 3].map((id) => call(student, "post", "/api/pets/me/inventory").send({ cosmeticId: id })));
    assert.equal(results.filter((r) => r.status === 201).length, 1);
    assert.equal((await petOf(student)).coins, 70);
  });

  it("validates body and blocks teachers", async () => {
    for (const body of [{}, { cosmeticId: "1" }, { cosmeticId: { $gt: 0 } }, { cosmeticId: 1.5 }, { cosmeticId: -1 }, { cosmeticId: 1, cost: 0 }]) {
      await call(student, "post", "/api/pets/me/inventory").send(body).expect(400);
    }
    await call(teacher, "post", "/api/pets/me/inventory").send({ cosmeticId: 1 }).expect(403);
    assert.equal((await petOf(student)).coins, 270);
  });
});

describe("UN-301 · PUT /api/pets/me/equipped (equip / unequip)", () => {
  beforeEach(async () => {
    await Pet.updateOne({ ownerId: student._id }, { inventory: [2, 6, 12] });
  });

  it("equips by slot, without touching others, and unequips with null", async () => {
    let { body } = await call(student, "put", "/api/pets/me/equipped").send({ head: 2 }).expect(200);
    assert.deepEqual(body.dog.equippedCosmetics, { head: 2, face: null, neck: null, body: null });
    ({ body } = await call(student, "put", "/api/pets/me/equipped").send({ face: 6, neck: 12 }).expect(200));
    assert.deepEqual(body.dog.equippedCosmetics, { head: 2, face: 6, neck: 12, body: null });
    ({ body } = await call(student, "put", "/api/pets/me/equipped").send({ head: null }).expect(200));
    assert.deepEqual(body.dog.equippedCosmetics, { head: null, face: 6, neck: 12, body: null });
  });

  it("does not equip what it doesn't own, nonexistent, or in wrong slot", async () => {
    const notOwned = await call(student, "put", "/api/pets/me/equipped").send({ head: 3 }).expect(409);
    assert.equal(notOwned.body.error.message, "That cosmetic isn't in your inventory yet.");
    await call(student, "put", "/api/pets/me/equipped").send({ head: 999 }).expect(404);
    await call(student, "put", "/api/pets/me/equipped").send({ head: 6 }).expect(400); // 6 is Face
    const pet = await petOf(student);
    assert.deepEqual(pet.equipped.toObject(), { head: null, face: null, neck: null, body: null });
  });

  it("all or nothing: one bad slot among valid ones changes nothing", async () => {
    await call(student, "put", "/api/pets/me/equipped").send({ head: 2, neck: 13 }).expect(409); // 13 is a Neck cosmetic not owned
    assert.equal((await petOf(student)).equipped.head, null);
  });

  it("rejects invalid slots, empty body, and wrong types; teacher 403", async () => {
    for (const body of [{}, { tail: 2 }, { head: "2" }, { head: { $ne: 1 } }, { head: 0 }]) {
      await call(student, "put", "/api/pets/me/equipped").send(body).expect(400);
    }
    await call(teacher, "put", "/api/pets/me/equipped").send({ head: 2 }).expect(403);
  });
});

describe("Audit · Mongoose errors and login", () => {
  it("a Mongoose ValidationError responds 400, not 500", async () => {
    const { errorHandler } = await import("../middleware/errorHandler.js");
    const err = new mongoose.Error.ValidationError();
    const res = { headersSent: false, status(c) { this.code = c; return this; }, json(b) { this.body = b; } };
    errorHandler(err, { method: "GET", path: "/x" }, res, () => {});
    assert.equal(res.code, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });
});
