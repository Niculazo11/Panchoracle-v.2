// Manual verification of UN-106 (classrooms API). NOT a seed; it removes what it creates.
//   node server/scripts/verify-un106.js --offline   (no MongoDB: validation, auth, roles)
//   node server/scripts/verify-un106.js             (full: needs MONGODB_URI, covers every criterion)
import "dotenv/config";
import mongoose from "mongoose";

const offline = process.argv.includes("--offline");
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "verify-un106-secret";
// Offline: pretend the database is already connected so ensureDb does not try to connect.
if (offline) global.__mongooseCache = { conn: {}, promise: null };

const { default: app } = await import("../app.js");
const { Classroom, User, Pet } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");
const { generateJoinCode } = await import("../utils/joinCode.js");
const { createClassroomSchema, joinClassroomSchema } = await import("../validators/classroom.js");

let failed = 0;
function check(ok, label) {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}`);
  if (!ok) failed++;
}

const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}/api/classrooms`;

// user = null sends no cookie. Returns { status, body }.
async function call(method, path, user, body) {
  const headers = { "Content-Type": "application/json" };
  if (user) headers.Cookie = `session=${signToken({ sub: user._id.toString() })}`;
  const response = await fetch(baseUrl + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const period = { startDate: "2027-02-01T00:00:00Z", endDate: "2027-06-04T23:59:59Z" };
const validBody = { name: "Programming I", period };

// ---------- pieces that need no database ----------
function pureChecks() {
  const code = generateJoinCode();
  check(/^[A-HJKMNP-Z2-9]{6}$/.test(code), `generated code is short and readable (${code})`);
  check(createClassroomSchema.safeParse(validBody).success, "schema accepts a valid body");
  check(!createClassroomSchema.safeParse({ ...validBody, extra: 1 }).success, "schema rejects unknown keys");
  check(!createClassroomSchema.safeParse({ ...validBody, name: { $ne: null } }).success, "schema rejects an object as name");
  check(
    !createClassroomSchema.safeParse({ ...validBody, period: { startDate: period.endDate, endDate: period.startDate } }).success,
    "schema rejects endDate before startDate"
  );
  check(joinClassroomSchema.safeParse({ joinCode: " abc123 " }).data?.joinCode === "ABC123", "join code is trimmed and uppercased");
}

async function httpChecksWithoutDb() {
  const teacher = new User({ name: "Teacher", email: "t@x.co", passwordHash: "h", role: "teacher" });
  const student = new User({ name: "Student", email: "s@x.co", passwordHash: "h", role: "student" });
  // Fake lookup so authenticate() can find these two users without a database.
  User.findById = async (id) => {
    if (String(id) === teacher._id.toString()) return teacher;
    if (String(id) === student._id.toString()) return student;
    return null;
  };
  const someId = new mongoose.Types.ObjectId().toString();

  check((await call("GET", "", null)).status === 401, "no cookie -> 401");
  const bad = await fetch(baseUrl, { headers: { Cookie: "session=garbage" } });
  check(bad.status === 401, "tampered token -> 401");
  check((await call("POST", "", student, validBody)).status === 403, "student cannot create a classroom -> 403");
  check((await call("POST", "/join", teacher, { joinCode: "ABC123" })).status === 403, "teacher cannot join -> 403");
  check((await call("POST", "", teacher, { name: "" })).status === 400, "invalid body -> 400");
  check((await call("PATCH", "/not-an-id", teacher, { name: "X" })).status === 400, "malformed id -> 400");
  check((await call("GET", `/${someId}/students`, student)).status === 403, "student cannot list students -> 403");
  const error = (await call("POST", "", teacher, {})).body;
  check(Boolean(error?.error?.code && error?.error?.message), "errors use { error: { code, message } }");
}

// ---------- full flow against MongoDB ----------
async function fullChecks() {
  const tag = `un106_${Date.now()}`;
  const mk = (role, n) => User.create({ name: `${role} ${n}`, email: `${tag}_${role}${n}@x.co`, passwordHash: "h", role });
  const [teacherA, teacherB, s1, s2, s3] = [await mk("teacher", "A"), await mk("teacher", "B"), await mk("student", 1), await mk("student", 2), await mk("student", 3)];
  const userIds = [teacherA._id, teacherB._id, s1._id, s2._id, s3._id];

  try {
    // create
    const created = await call("POST", "", teacherA, validBody);
    const roomA = created.body?.classroom;
    check(created.status === 201 && /^[A-Z0-9]{6}$/.test(roomA?.joinCode), `create -> 201 with a 6-character code (${roomA?.joinCode})`);
    check((await call("POST", "", teacherA, validBody)).status === 409, "second classroom for the same teacher -> 409");
    check((await call("POST", "", teacherB, { ...validBody, joinCode: roomA.joinCode.toLowerCase() })).status === 409, "duplicate custom code -> 409");
    const createdB = await call("POST", "", teacherB, { ...validBody, name: "Other" });
    const roomB = createdB.body?.classroom;
    check(createdB.status === 201 && roomB.joinCode !== roomA.joinCode, "generated codes are unique across classrooms");

    // list
    check((await call("GET", "", teacherA)).body.classrooms.length === 1, "teacher lists their classroom");
    check((await call("GET", "", s1)).body.classrooms.length === 0, "student without classroom lists nothing");

    // join
    check((await call("POST", "/join", s1, { joinCode: "ZZZZZZ" })).status === 404, "unknown code -> 404");
    const first = await call("POST", "/join", s1, { joinCode: roomA.joinCode.toLowerCase() });
    check(first.status === 201 && first.body.alreadyJoined === false, "first join -> 201 (code is case-insensitive)");
    const second = await call("POST", "/join", s1, { joinCode: roomA.joinCode });
    check(second.status === 200 && second.body.alreadyJoined === true, "second join -> 200, alreadyJoined");
    check((await User.countDocuments({ classroomId: roomA.id })) === 2 /* teacher + s1 */, "joining twice does not duplicate enrollment");
    check((await Pet.countDocuments({ ownerId: s1._id })) === 1, "joining twice does not duplicate the pet");
    check((await call("POST", "/join", s1, { joinCode: roomB.joinCode })).status === 409, "student already in another classroom -> 409");
    check((await call("GET", "", s1)).body.classrooms[0]?.id === roomA.id, "student lists the classroom they joined");

    // students
    const students = await call("GET", `/${roomA.id}/students`, teacherA);
    check(students.body.students.length === 1 && students.body.students[0].pet?.status === "alive" && students.body.students[0].pet?.health === 100, "students list with pet summary");
    check((await call("GET", `/${roomA.id}/students`, teacherB)).status === 403, "another teacher -> 403");
    check((await call("GET", `/${new mongoose.Types.ObjectId()}/students`, teacherA)).status === 404, "unknown classroom -> 404");

    // rename
    const renamed = await call("PATCH", `/${roomA.id}`, teacherA, { name: "Renamed" });
    check(renamed.status === 200 && renamed.body.classroom.name === "Renamed", "rename -> 200");

    // remove student keeps the pet; rejoining never revives it
    await Pet.updateOne({ ownerId: s1._id }, { status: "dead", health: 0 });
    const removed = await call("DELETE", `/${roomA.id}/students/${s1._id}`, teacherA);
    check(removed.status === 200 && (await User.findById(s1._id)).classroomId === null, "remove student -> unenrolled");
    check((await Pet.countDocuments({ ownerId: s1._id })) === 1, "remove student keeps the pet");
    check((await call("DELETE", `/${roomA.id}/students/${s1._id}`, teacherA)).status === 404, "removing again -> 404");
    await call("POST", "/join", s1, { joinCode: roomA.joinCode });
    check((await Pet.findOne({ ownerId: s1._id })).status === "dead", "rejoining the same classroom does not revive the pet");

    // delete with students
    await call("POST", "/join", s2, { joinCode: roomA.joinCode });
    await call("POST", "/join", s3, { joinCode: roomA.joinCode });
    check((await call("DELETE", `/${roomA.id}`, teacherB)).status === 403, "another teacher cannot delete -> 403");
    const deleted = await call("DELETE", `/${roomA.id}`, teacherA);
    check(deleted.status === 200 && deleted.body.unenrolledStudents === 3, "delete reports 3 unenrolled students");
    check((await Classroom.findById(roomA.id)) === null, "classroom is gone");
    check((await User.countDocuments({ classroomId: roomA.id })) === 0, "nobody is left enrolled");
    check((await Pet.countDocuments({ ownerId: { $in: [s1._id, s2._id, s3._id] } })) === 3, "delete keeps all pets");
    check((await call("DELETE", `/${roomA.id}`, teacherA)).status === 404, "deleting twice -> 404");
  } finally {
    await Pet.deleteMany({ ownerId: { $in: userIds } });
    await Classroom.deleteMany({ teacherId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }
}

try {
  pureChecks();
  if (offline) {
    await httpChecksWithoutDb();
  } else {
    const { connectDB } = await import("../config/db.js");
    await connectDB();
    await Promise.all([User.init(), Classroom.init(), Pet.init()]); // make sure the unique indexes exist
    await fullChecks();
  }
} finally {
  server.close();
  await mongoose.disconnect();
}
console.log(failed === 0 ? "\nAll checks passed" : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
