// Verificación manual de UN-102. NO es el seed y NO deja datos en la base.
//   node server/scripts/verify-un102.js --offline   (sin MongoDB: pruebas 1 y 9)
//   node server/scripts/verify-un102.js             (completo: pruebas 1, 3-9)
import "dotenv/config";
import mongoose from "mongoose";
import * as Models from "../models/index.js";

const { User, Classroom, Assignment, Pet, Submission, MinigamePlay, Cosmetic, QuizQuestion } = Models;
const offline = process.argv.includes("--offline");
const tag = `un102_${Date.now()}`;
const oid = () => new mongoose.Types.ObjectId();
let failed = 0;

function check(ok, label) {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}`);
  if (!ok) failed++;
}

async function errorOf(doc) {
  return doc.validate().then(() => null, (error) => error);
}

async function validations() {
  const user = { name: "Ana Perez", email: "ana@correo.com", passwordHash: "h", role: "student" };
  const cls = { name: "Aula", teacherId: oid(), joinCode: "A1", period: { startDate: new Date("2026-08-01"), endDate: new Date("2026-12-01") } };
  const sub = { assignmentId: oid(), studentId: oid(), fileName: "a.pdf", fileUrl: "https://x.co/a", storageKey: "k" };
  const cos = { cosmeticId: 1, name: "Skully bow", category: "Head", cost: 230, image: "images/skully-bow.png" };
  const quiz = { questionId: "q1", prompt: "7 x 8?", options: ["54", "56"], correctIndex: 1 };
  const cases = [
    ["user válido sin username", new User(user), true],
    ["user role inválido", new User({ ...user, role: "admin" }), false],
    ["user email inválido", new User({ ...user, email: "nope" }), false],
    ["user username muy corto", new User({ ...user, username: "ab" }), false],
    ["user sin passwordHash", new User({ ...user, passwordHash: undefined }), false],
    ["classroom válido", new Classroom(cls), true],
    ["classroom endDate <= startDate", new Classroom({ ...cls, period: { ...cls.period, endDate: new Date("2026-07-01") } }), false],
    ["assignment sin dueAt", new Assignment({ classroomId: oid(), periodId: oid(), title: "T" }), false],
    ["pet válido (health decimal)", new Pet({ ownerId: oid(), periodId: oid(), coins: 0, health: 33.3 }), true],
    ["pet health > 100", new Pet({ ownerId: oid(), periodId: oid(), coins: 0, health: 101 }), false],
    ["pet status revived", new Pet({ ownerId: oid(), periodId: oid(), coins: 0, status: "revived" }), false],
    ["submission válida", new Submission(sub), true],
    ["submission sin fileUrl", new Submission({ ...sub, fileUrl: undefined }), false],
    ["minigame_play válida", new MinigamePlay({ studentId: oid(), gameId: "memory", reward: 5 }), true],
    ["minigame_play sin gameId", new MinigamePlay({ studentId: oid(), reward: 5 }), false],
    ["cosmetic válido", new Cosmetic(cos), true],
    ["cosmetic category inválida", new Cosmetic({ ...cos, category: "Tail" }), false],
    ["quiz válida", new QuizQuestion(quiz), true],
    ["quiz correctIndex fuera de rango", new QuizQuestion({ ...quiz, correctIndex: 5 }), false],
  ];
  for (const [label, doc, shouldPass] of cases) {
    check(((await errorOf(doc)) === null) === shouldPass, `validación: ${label}`);
  }
}

async function duplicate(label, fn) {
  try { await fn(); check(false, `${label} (se aceptó el duplicado)`); }
  catch (error) { check(error.code === 11000, label); }
}

const hasIndex = (list, key, unique) =>
  list.some((i) => JSON.stringify(i.key) === JSON.stringify(key) && Boolean(i.unique) === unique);

async function database() {
  const { connectDB } = await import("../config/db.js");
  await connectDB();
  console.log("MongoDB conectado");
  await Promise.all(Object.values(Models).map((model) => model.init()));

  const idx = (model) => model.collection.indexes();
  const users = await idx(User);
  check(hasIndex(users, { email: 1 }, true), "índice único users.email");
  check(users.some((i) => i.key.username === 1 && i.unique && i.partialFilterExpression), "índice único PARCIAL users.username");
  check(hasIndex(users, { classroomId: 1 }, false), "índice users.classroomId");
  const rooms = await idx(Classroom);
  check(hasIndex(rooms, { joinCode: 1 }, true), "índice único classrooms.joinCode");
  check(hasIndex(rooms, { teacherId: 1 }, true), "índice único classrooms.teacherId");
  check(hasIndex(await idx(Assignment), { classroomId: 1, periodId: 1, dueAt: 1 }, true), "índice único assignments (classroomId, periodId, dueAt)");
  check(hasIndex(await idx(Pet), { ownerId: 1 }, true), "índice único pets.ownerId");
  check(hasIndex(await idx(Submission), { assignmentId: 1, studentId: 1 }, true), "índice único submissions (assignmentId, studentId)");
  check(hasIndex(await idx(MinigamePlay), { studentId: 1, playedAt: 1 }, false), "índice minigame_plays (studentId, playedAt)");
  check(hasIndex(await idx(Cosmetic), { cosmeticId: 1 }, true), "índice único cosmetics.cosmeticId");
  check(hasIndex(await idx(QuizQuestion), { questionId: 1 }, true), "índice único quiz_questions.questionId");

  const base = { passwordHash: "x", role: "student" };
  const created = await User.create({ ...base, name: "Test Uno", email: `${tag}@t.co`, username: tag });
  check((await User.findById(created._id)).passwordHash === undefined, "passwordHash no se devuelve por defecto");
  await duplicate("email duplicado rechazado", () => User.create({ ...base, name: "Test Dos", email: `${tag}@T.CO` }));
  await duplicate("username duplicado rechazado", () => User.create({ ...base, name: "Test Tres", email: `b_${tag}@t.co`, username: tag }));
  await User.create({ ...base, name: "Sin Username 1", email: `c_${tag}@t.co` });
  await User.create({ ...base, name: "Sin Username 2", email: `d_${tag}@t.co` });
  check(true, "dos usuarios SIN username conviven (índice parcial)");

  const period = { startDate: new Date("2026-08-01"), endDate: new Date("2026-12-01") };
  await Classroom.create({ name: "Aula A", teacherId: oid(), joinCode: tag, period });
  await duplicate("joinCode duplicado rechazado", () => Classroom.create({ name: "Aula B", teacherId: oid(), joinCode: tag, period }));

  const [assignmentId, studentId] = [oid(), oid()];
  const file = { fileName: "a.pdf", fileUrl: "https://example.com/a.pdf", storageKey: `k/${tag}` };
  await Submission.create({ assignmentId, studentId, ...file });
  await duplicate("(assignmentId, studentId) duplicado rechazado", () => Submission.create({ assignmentId, studentId, ...file }));

  console.log(`cosmetics en MongoDB: ${await Cosmetic.countDocuments()} (se llenan en UN-111)`);
  console.log(`quiz_questions en MongoDB: ${await QuizQuestion.countDocuments()} (se llenan en UN-111)`);
}

try {
  check(Object.keys(Models).length === 8, "los 8 modelos cargan");
  const names = Object.values(Models).map((m) => m.collection.name).sort().join(",");
  check(names === "assignments,classrooms,cosmetics,minigame_plays,pets,quiz_questions,submissions,users", "nombres de colección correctos");
  await validations();
  if (!offline) await database();
} catch (error) {
  failed++;
  console.error("Error:", error.message);
} finally {
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({ $or: [{ username: tag }, { email: new RegExp(`${tag}@t\\.co$`, "i") }] });
    await Classroom.deleteMany({ joinCode: tag });
    await Submission.deleteMany({ storageKey: `k/${tag}` });
    await mongoose.disconnect();
  }
  console.log(failed ? `\n${failed} verificación(es) fallaron` : "\nTodo OK");
  process.exit(failed ? 1 : 0);
}