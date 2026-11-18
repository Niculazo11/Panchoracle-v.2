// UN-111 · Seed for development and demo.
//   SEED_PASSWORD=<value> npm run seed -- --yes
// Repeatable: it only deletes demo data (@seed.panchoracle.test accounts and everything
// that hangs from them) and creates it again. Cosmetics and quiz questions are synced with
// the content that lives in the client (src/data/dataset.json and quizQuestions.js).
//
// Pet health/hunger are NOT hard-coded: they are derived from the assignments and
// submissions below with the same pure function the API uses (computePetState), so the
// values stored here match what GET /api/me/game returns when the pets are read.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User, Classroom, Assignment, Pet, Submission, Cosmetic, QuizQuestion } from "../models/index.js";
import { computePetState } from "../services/petStateService.js";
import { QUIZ_QUESTIONS } from "../../src/pages/minigames/quizQuestions.js";

const DATASET_PATH = fileURLToPath(new URL("../../src/data/dataset.json", import.meta.url));
const COSMETICS = JSON.parse(readFileSync(DATASET_PATH, "utf8"));

const SEED_DOMAIN = "seed.panchoracle.test";
const JOIN_CODE = "SEED42";
const DAY = 24 * 60 * 60 * 1000;
const SLOT_BY_CATEGORY = { Head: "head", Face: "face", Neck: "neck", Body: "body" };
const LOCAL_URI = /^mongodb:\/\/(127\.0\.0\.1|localhost)([:/]|$)/;
const LOCAL_ONLY_DEFAULT_PASSWORD = "Seed1234";

// Same rules as server/validators/game.js (PUT /api/pets/me/pancho).
const PANCHO_ID_RULE = /^[A-Za-z0-9._-]+$/;
const IMG_URL_RULE = /^https:\/\/images\.dog\.ceo\/[A-Za-z0-9/_.-]+$/;
// Image used by the demo pets (same URL as server/tests/game.test.js). More can be taken from
// https://dog.ceo/api/breed/dachshund/images: any "https://images.dog.ceo/..." URL is valid.
const DEMO_DOG_IMAGES = ["https://images.dog.ceo/breeds/dachshund/n02085620_10074.jpg"];
// Same rule as dogIdFromUrl() in src/lib/dogStorage.js: file name without extension.
const dogIdFromUrl = (url) => (url.split("/").pop() || url).replace(/\.[a-zA-Z0-9]+$/, "");
const panchoFor = (index) => {
  const imgUrl = DEMO_DOG_IMAGES[index % DEMO_DOG_IMAGES.length];
  return { panchoId: dogIdFromUrl(imgUrl), imgUrl };
};

const TEACHER = { name: "Demo Teacher", email: `teacher@${SEED_DOMAIN}` };

// Assignment due dates, in days from now. The period starts 30 days ago and has 5 assignments
// (each missed assignment costs 20 health). `submits` are indexes into this list.
const DUE_DAYS = [-21, -14, -7, 3, 10];
// cosmetics: purchased ids; equip: equipped ids (must be in cosmetics).
// expect: health/hunger the API must derive (hunger is a snapshot, so it is approximate).
const STUDENTS = [
  { name: "Ana Demo", email: `ana@${SEED_DOMAIN}`, coins: 270, status: "alive", cosmetics: [1, 6], equip: [1, 6], submits: [0, 1, 2], expect: { health: 100, hunger: 30 } },
  { name: "Bruno Demo", email: `bruno@${SEED_DOMAIN}`, coins: 150, status: "alive", cosmetics: [12], equip: [12], submits: [0, 2], expect: { health: 80, hunger: 30 } },
  { name: "Carla Demo", email: `carla@${SEED_DOMAIN}`, coins: 0, status: "alive", cosmetics: [], equip: [], submits: [0], expect: { health: 60, hunger: 30 } },
  { name: "Diego Demo", email: `diego@${SEED_DOMAIN}`, coins: 35, status: "dead", cosmetics: [16], equip: [], submits: [], expect: { health: 0, hunger: 0 } },
  { name: "Elena Demo", email: `elena@${SEED_DOMAIN}`, coins: 270, status: "alive", cosmetics: [], equip: [], submits: [0, 1, 2, 3], expect: { health: 100, hunger: 100 } },
];

// Host/database of the target, without credentials. Works for mongodb:// and mongodb+srv://.
function describeTarget(uri) {
  try {
    const url = new URL(uri);
    return `${url.host}${url.pathname}`;
  } catch {
    return "(unparseable URI, resolved after connecting)";
  }
}

function resolvePassword(uri) {
  if (process.env.SEED_PASSWORD) return process.env.SEED_PASSWORD;
  if (LOCAL_URI.test(uri)) return LOCAL_ONLY_DEFAULT_PASSWORD;
  throw new Error("SEED_PASSWORD is required (a default is only allowed for a local MongoDB).");
}

// Everything that can be checked without touching the network or the database.
function preflight() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error("The seed never runs in production.");
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  console.log(`Target: ${describeTarget(uri)}`);
  if (!process.argv.includes("--yes")) {
    throw new Error("This script deletes and recreates demo data. Re-run with --yes to confirm: npm run seed -- --yes");
  }
  const password = resolvePassword(uri);
  if (password.length < 8) throw new Error("SEED_PASSWORD must have at least 8 characters.");
  for (let index = 0; index < STUDENTS.length; index++) {
    const { panchoId, imgUrl } = panchoFor(index);
    if (!PANCHO_ID_RULE.test(panchoId) || !IMG_URL_RULE.test(imgUrl)) throw new Error(`Invalid Pancho image for student ${index}.`);
  }
  return password;
}

function buildEquipped(ids) {
  const equipped = { head: null, face: null, neck: null, body: null };
  for (const id of ids) {
    const cosmetic = COSMETICS.find((item) => item.id === id);
    if (!cosmetic) throw new Error(`Cosmetic ${id} does not exist in dataset.json`);
    equipped[SLOT_BY_CATEGORY[cosmetic.category]] = id;
  }
  return equipped;
}

async function clearPreviousSeed() {
  const emails = [TEACHER.email, ...STUDENTS.map((student) => student.email)];
  const users = await User.find({ email: { $in: emails } }).select("_id");
  const userIds = users.map((user) => user._id);
  const classrooms = await Classroom.find({ teacherId: { $in: userIds } }).select("_id");
  const classroomIds = classrooms.map((classroom) => classroom._id);

  const assignments = await Assignment.find({ classroomId: { $in: classroomIds } }).select("_id");
  await Submission.deleteMany({ $or: [{ studentId: { $in: userIds } }, { assignmentId: { $in: assignments.map((a) => a._id) } }] });
  await Assignment.deleteMany({ classroomId: { $in: classroomIds } });
  await Pet.deleteMany({ ownerId: { $in: userIds } });
  await Classroom.deleteMany({ _id: { $in: classroomIds } });
  await User.deleteMany({ _id: { $in: userIds } });
}

async function syncCosmetics() {
  await Cosmetic.bulkWrite(
    COSMETICS.map((item) => ({
      updateOne: {
        filter: { cosmeticId: item.id },
        update: { $set: { name: item.name, category: item.category, cost: item.cost, image: item.image } },
        upsert: true,
      },
    }))
  );
  await Cosmetic.deleteMany({ cosmeticId: { $nin: COSMETICS.map((item) => item.id) } });
}

async function syncQuiz() {
  await QuizQuestion.bulkWrite(
    QUIZ_QUESTIONS.map((question) => ({
      updateOne: {
        filter: { questionId: question.id },
        update: { $set: { prompt: question.prompt, options: question.options, correctIndex: question.correctIndex } },
        upsert: true,
      },
    }))
  );
  await QuizQuestion.deleteMany({ questionId: { $nin: QUIZ_QUESTIONS.map((question) => question.id) } });
}

// Health/hunger come from the real rules, then are checked against the documented table so
// the seed fails loudly if the formula or the data ever drift apart.
function deriveState(data, classroom, assignments, submittedIds, now) {
  if (data.status === "dead") return { health: 0, hunger: 0, status: "dead" };
  const state = computePetState({
    pet: { health: 100, hunger: 100, status: "alive", healthAdjustment: 0 },
    period: classroom.period,
    assignments: assignments.map((item) => ({ id: item._id.toString(), dueAt: item.dueAt })),
    submittedIds,
    now,
  });
  if (state.health !== data.expect.health || Math.abs(state.hunger - data.expect.hunger) > 0.5) {
    throw new Error(`${data.name}: derived ${state.health}/${state.hunger}, expected ${data.expect.health}/${data.expect.hunger}`);
  }
  return state;
}

async function seedClassroom(passwordHash) {
  const now = Date.now();

  const teacher = await User.create({ ...TEACHER, passwordHash, role: "teacher" });
  const classroom = await Classroom.create({
    name: "Demo Classroom",
    teacherId: teacher._id,
    joinCode: JOIN_CODE,
    period: { startDate: new Date(now - 30 * DAY), endDate: new Date(now + 60 * DAY), totalAssignments: DUE_DAYS.length },
  });
  await User.updateOne({ _id: teacher._id }, { classroomId: classroom._id });
  const periodId = classroom.period.periodId;

  const assignments = await Assignment.insertMany(
    DUE_DAYS.map((days, index) => ({
      classroomId: classroom._id,
      periodId,
      title: `Assignment ${index + 1} (${days < 0 ? "overdue" : "upcoming"})`,
      description: days < 0 ? "Due date already passed." : "Still open.",
      dueAt: new Date(now + days * DAY),
    }))
  );

  const studentIds = [];
  for (const [position, data] of STUDENTS.entries()) {
    const student = await User.create({ name: data.name, email: data.email, passwordHash, role: "student", classroomId: classroom._id });
    studentIds.push(student._id);
    const submittedIds = new Set(data.submits.map((index) => assignments[index]._id.toString()));
    const state = deriveState(data, classroom, assignments, submittedIds, now);
    await Pet.create({
      ownerId: student._id,
      periodId,
      name: "Pancho",
      ...panchoFor(position),
      health: state.health,
      hunger: state.hunger,
      coins: data.coins,
      status: state.status,
      inventory: data.cosmetics,
      equipped: buildEquipped(data.equip),
    });
    for (const index of data.submits) {
      const assignment = assignments[index];
      const slug = `${data.name.split(" ")[0].toLowerCase()}-assignment-${index + 1}.pdf`;
      await Submission.create({
        assignmentId: assignment._id,
        studentId: student._id,
        fileName: slug,
        fileUrl: `https://example.com/seed/${slug}`,
        storageKey: `seed/${slug}`,
        submittedAt: new Date(assignment.dueAt.getTime() - 2 * DAY),
      });
    }
  }
  return [teacher._id, ...studentIds];
}

async function main() {
  const password = preflight();
  await connectDB();
  console.log(`Connected to: ${mongoose.connection.host}/${mongoose.connection.name}`);

  const passwordHash = await bcrypt.hash(password, 10);
  await clearPreviousSeed();
  await syncCosmetics();
  await syncQuiz();
  const userIds = await seedClassroom(passwordHash);

  const counts = {
    users: await User.countDocuments({ _id: { $in: userIds } }),
    pets: await Pet.countDocuments({ ownerId: { $in: userIds } }),
    deadPets: await Pet.countDocuments({ ownerId: { $in: userIds }, status: "dead" }),
    cosmetics: await Cosmetic.countDocuments(),
    quizQuestions: await QuizQuestion.countDocuments(),
  };
  console.log("Seed done:", counts);
  console.log(`Teacher: ${TEACHER.email} | Students: ana, bruno, carla, diego (dead pet), elena @${SEED_DOMAIN}`);
  console.log(`Join code: ${JOIN_CODE} | Password: taken from SEED_PASSWORD (not printed)`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());