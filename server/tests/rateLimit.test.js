// UN-603 · Login rate limit (429 + Retry-After).
// authRateLimit is bypassed when NODE_ENV === "test" and VERCEL is unset, so this file sets
// NODE_ENV to "development" BEFORE importing the app and restores it at the end.
// Run with: node --test server/tests/rateLimit.test.js   (node:test + mongodb-memory-server)

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
process.env.JWT_SECRET = "test-jwt-secret-very-long-and-secure-for-testing-only";
process.env.NODE_ENV = "development";
delete process.env.VERCEL;

const { default: app } = await import("../app.js");
const { User } = await import("../models/index.js");
const { default: RateLimit } = await import("../models/RateLimit.js");

const MAX_FAILED_LOGINS = 5;
let mongod;
let server;

const login = (email, password) => request(server).post("/api/auth/login").send({ email, password });

before(async () => {
  mongod = await MongoMemoryServer.create({ binary: { version: "7.0.0" } });
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.syncIndexes(), RateLimit.syncIndexes()]);
  server = app.listen(0);
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  server.close();
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), RateLimit.deleteMany({})]);
});

describe("UN-603 · POST /api/auth/login rate limit", () => {
  it("the 6th failed login of the same email gets 429 RATE_LIMITED with Retry-After", async () => {
    for (let attempt = 1; attempt <= MAX_FAILED_LOGINS; attempt++) {
      const res = await login("victima@test.com", "wrong-password").expect(401);
      assert.equal(res.body.error.code, "UNAUTHORIZED");
    }

    const blocked = await login("victima@test.com", "wrong-password").expect(429);
    assert.equal(blocked.body.error.code, "RATE_LIMITED");
    const retryAfter = Number(blocked.headers["retry-after"]);
    assert.ok(Number.isFinite(retryAfter) && retryAfter > 0, "Retry-After must be a positive number of seconds");
  });

  it("a different email is not affected by the block", async () => {
    for (let attempt = 1; attempt <= MAX_FAILED_LOGINS; attempt++) {
      await login("victima@test.com", "wrong-password").expect(401);
    }
    await login("victima@test.com", "wrong-password").expect(429);

    const other = await login("otro@test.com", "wrong-password");
    assert.equal(other.status, 401);
  });

  it("the block does not leak whether the email exists", async () => {
    await User.create({ name: "Real", email: "real@test.com", passwordHash: bcrypt.hashSync("Secret123", 4), role: "student" });
    const unknown = await login("fantasma@test.com", "wrong-password").expect(401);
    const known = await login("real@test.com", "wrong-password").expect(401);
    assert.deepEqual(unknown.body, known.body);
  });
});