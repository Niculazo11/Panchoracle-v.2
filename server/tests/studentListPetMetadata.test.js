// SRV_STU_PET_META · GET /api/classrooms/:id/students with the flag enable_student_list_pet_metadata.
// Run with: node --test server/tests/studentListPetMetadata.test.js
import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");
const { User, Classroom, Pet } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");
const { breedFromImgUrl, toPetMetadata } = await import("../services/petMetadata.js");
const { isStudentListPetMetadataEnabled } = await import("../config/features.js");

const DAY = 24 * 60 * 60 * 1000;
const IMG = "https://images.dog.ceo/breeds/dachshund/n02085620_10074.jpg";
const FLAG = "ENABLE_STUDENT_LIST_PET_METADATA";

let mongod, server, teacher, classroom;
const cookieOf = (user) => [`session=${signToken({ sub: user._id.toString() })}`];
const list = () => request(server).get(`/api/classrooms/${classroom._id}/students`).set("Cookie", cookieOf(teacher)).expect(200);
const makeUser = (name, role) => User.create({ name, email: `${name}@test.com`, passwordHash: "x".repeat(60), role });
const byName = (students, name) => students.find((s) => s.name === name);

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  server = app.listen(0);
});
after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  delete process.env[FLAG];
  await Promise.all([User.deleteMany({}), Classroom.deleteMany({}), Pet.deleteMany({})]);
  teacher = await makeUser("teacher", "teacher");
  classroom = await Classroom.create({
    name: "Room", teacherId: teacher._id, joinCode: "ABC234",
    period: { startDate: new Date(Date.now() - DAY), endDate: new Date(Date.now() + 60 * DAY) },
  });
  const chosen = await makeUser("chosen", "student");
  const bare = await makeUser("bare", "student");
  await makeUser("nopet", "student");
  await User.updateMany({ role: "student" }, { classroomId: classroom._id });
  const base = { periodId: classroom.period.periodId, coins: 270 };
  await Pet.create({ ...base, ownerId: chosen._id, panchoId: "n02085620_10074", imgUrl: IMG, equipped: { head: 3, body: 7 } });
  await Pet.create({ ...base, ownerId: bare._id }); // no dog chosen, nothing equipped
});

describe("SRV_STU_PET_META · pure helpers", () => {
  it("reads the breed from a dog.ceo URL and returns null for anything else", () => {
    assert.equal(breedFromImgUrl(IMG), "dachshund");
    assert.equal(breedFromImgUrl("https://images.dog.ceo/breeds/hound-afghan/a.jpg"), "hound-afghan");
    for (const bad of [null, undefined, "", 42, "https://evil.test/breeds/x/a.jpg"]) assert.equal(breedFromImgUrl(bad), null);
  });

  it("a pet without dog or cosmetics gives nulls, not errors", () => {
    assert.deepEqual(toPetMetadata({}), {
      dogId: null, breed: null, imgUrl: null, cosmetics: { head: null, face: null, neck: null, body: null },
    });
  });

  it("the flag is OFF unless explicitly enabled", () => {
    assert.equal(isStudentListPetMetadataEnabled({}), false);
    assert.equal(isStudentListPetMetadataEnabled({ [FLAG]: "false" }), false);
    assert.equal(isStudentListPetMetadataEnabled({ [FLAG]: " TRUE " }), true);
  });
});

describe("SRV_STU_PET_META · student list endpoint", () => {
  it("flag OFF: the pet keeps exactly status, health and hunger (backward compatible)", async () => {
    const { body } = await list();
    for (const name of ["chosen", "bare"]) {
      assert.deepEqual(Object.keys(byName(body.students, name).pet).sort(), ["health", "hunger", "status"]);
    }
  });

  it("flag ON: adds dogId, breed, imgUrl and cosmetics and keeps the original keys", async () => {
    process.env[FLAG] = "true";
    const { body } = await list();
    const pet = byName(body.students, "chosen").pet;
    assert.equal(pet.status, "alive");
    assert.equal(pet.health, 100);
    assert.equal(pet.dogId, "n02085620_10074");
    assert.equal(pet.breed, "dachshund");
    assert.equal(pet.imgUrl, IMG);
    assert.deepEqual(pet.cosmetics, { head: 3, face: null, neck: null, body: 7 });
  });

  it("flag ON: a pet with no dog or cosmetics, and a student with no pet, are handled", async () => {
    process.env[FLAG] = "true";
    const { body } = await list();
    const bare = byName(body.students, "bare").pet;
    assert.deepEqual([bare.dogId, bare.breed, bare.imgUrl], [null, null, null]);
    assert.deepEqual(bare.cosmetics, { head: null, face: null, neck: null, body: null });
    assert.equal(byName(body.students, "nopet").pet, null);
  });

  it("flag ON: still teacher-only and still hides the password hash", async () => {
    process.env[FLAG] = "true";
    const student = await User.findOne({ name: "chosen" });
    await request(server).get(`/api/classrooms/${classroom._id}/students`).set("Cookie", cookieOf(student)).expect(403);
    assert.ok(!JSON.stringify((await list()).body).includes("passwordHash"));
  });
});
