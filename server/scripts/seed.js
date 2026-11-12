// UN-111 · Seed para desarrollo y demo.
//   npm run seed
// Es repetible: borra solo los datos de demo (cuentas @seed.panchoracle.test y lo que
// cuelga de ellas) y los vuelve a crear. Cosméticos y preguntas del quiz se sincronizan
// con el contenido que vive en el cliente (src/data/dataset.json y quizQuestions.js).
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User, Classroom, Assignment, Pet, Submission, Cosmetic, QuizQuestion } from "../models/index.js";
import { QUIZ_QUESTIONS } from "../../src/pages/minigames/quizQuestions.js";

if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  console.error("El seed no se ejecuta en producción.");
  process.exit(1);
}

const DATASET_PATH = fileURLToPath(new URL("../../src/data/dataset.json", import.meta.url));
const COSMETICS = JSON.parse(readFileSync(DATASET_PATH, "utf8"));

const SEED_DOMAIN = "seed.panchoracle.test";
const SEED_PASSWORD = "Seed1234";
const JOIN_CODE = "SEED42";
const DAY = 24 * 60 * 60 * 1000;
const SLOT_BY_CATEGORY = { Head: "head", Face: "face", Neck: "neck", Body: "body" };

const TEACHER = { name: "Profesora Demo", email: `profesora@${SEED_DOMAIN}` };

// cosmetics: ids comprados; equip: ids equipados (deben estar en cosmetics).
const STUDENTS = [
  { name: "Ana Demo", email: `ana@${SEED_DOMAIN}`, pet: { health: 100, hunger: 100, coins: 270, status: "alive", cosmetics: [1, 6], equip: [1, 6] }, submits: [0] },
  { name: "Bruno Demo", email: `bruno@${SEED_DOMAIN}`, pet: { health: 60, hunger: 40, coins: 150, status: "alive", cosmetics: [12], equip: [12] }, submits: [0] },
  { name: "Carla Demo", email: `carla@${SEED_DOMAIN}`, pet: { health: 20, hunger: 10, coins: 0, status: "alive", cosmetics: [], equip: [] }, submits: [] },
  { name: "Diego Demo", email: `diego@${SEED_DOMAIN}`, pet: { health: 0, hunger: 0, coins: 35, status: "dead", cosmetics: [16], equip: [] }, submits: [] },
  { name: "Elena Demo", email: `elena@${SEED_DOMAIN}`, pet: { health: 100, hunger: 85, coins: 270, status: "alive", cosmetics: [], equip: [] }, submits: [0, 1] },
];

function buildEquipped(ids) {
  const equipped = { head: null, face: null, neck: null, body: null };
  for (const id of ids) {
    const cosmetic = COSMETICS.find((item) => item.id === id);
    if (!cosmetic) throw new Error(`Cosmético ${id} no existe en dataset.json`);
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

async function seedClassroom(passwordHash) {
  const now = Date.now();

  const teacher = await User.create({ ...TEACHER, passwordHash, role: "teacher" });
  const classroom = await Classroom.create({
    name: "Salón Demo",
    teacherId: teacher._id,
    joinCode: JOIN_CODE,
    period: { startDate: new Date(now - 14 * DAY), endDate: new Date(now + 60 * DAY), totalAssignments: 3 },
  });
  await User.updateOne({ _id: teacher._id }, { classroomId: classroom._id });
  const periodId = classroom.period.periodId;

  const assignments = await Assignment.insertMany([
    { classroomId: classroom._id, periodId, title: "Tarea 1 (vencida)", description: "Entrega ya vencida.", dueAt: new Date(now - 7 * DAY) },
    { classroomId: classroom._id, periodId, title: "Tarea 2 (activa)", description: "Tarea activa del periodo.", dueAt: new Date(now + 3 * DAY) },
    { classroomId: classroom._id, periodId, title: "Tarea 3 (futura)", description: "Aún no es la activa.", dueAt: new Date(now + 10 * DAY) },
  ]);

  for (const data of STUDENTS) {
    const student = await User.create({ name: data.name, email: data.email, passwordHash, role: "student", classroomId: classroom._id });
    await Pet.create({
      ownerId: student._id,
      periodId,
      name: "Pancho",
      health: data.pet.health,
      hunger: data.pet.hunger,
      coins: data.pet.coins,
      status: data.pet.status,
      inventory: data.pet.cosmetics,
      equipped: buildEquipped(data.pet.equip),
    });
    for (const index of data.submits) {
      const assignment = assignments[index];
      const slug = `${data.name.split(" ")[0].toLowerCase()}-tarea-${index + 1}.pdf`;
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
}

async function main() {
  await connectDB();
  console.log(`Base de datos: ${mongoose.connection.host}/${mongoose.connection.name}`);

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  await clearPreviousSeed();
  await syncCosmetics();
  await syncQuiz();
  await seedClassroom(passwordHash);

  const counts = {
    users: await User.countDocuments({ email: { $regex: `@${SEED_DOMAIN}$` } }),
    pets: await Pet.countDocuments(),
    deadPets: await Pet.countDocuments({ status: "dead" }),
    cosmetics: await Cosmetic.countDocuments(),
    quizQuestions: await QuizQuestion.countDocuments(),
  };
  console.log("Seed listo:", counts);
  console.log(`Profesor: ${TEACHER.email} | Estudiantes: ana, bruno, carla, diego (mascota muerta), elena @${SEED_DOMAIN}`);
  console.log(`Contraseña de todas las cuentas: ${SEED_PASSWORD} | Código del salón: ${JOIN_CODE}`);
}

main()
  .catch((error) => {
    console.error("Seed falló:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());