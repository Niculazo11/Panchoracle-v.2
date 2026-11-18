// UN-501 · Integration tests for quiz minigame grading on the server.
// Run with: node --test server/tests/minigames.test.js
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";

const { default: app } = await import("../app.js");
const { User, Pet, QuizQuestion, MinigamePlay, Classroom } = await import("../models/index.js");
const { signToken } = await import("../utils/jwt.js");
const { connectDB } = await import("../config/db.js");

let mongod;
let server;
let student;
let teacher;
let classroom;
let pet;

const cookieOf = (user) => `session=${signToken({ sub: user._id.toString() })}`;

async function seedQuizQuestions() {
  const questions = [
    { questionId: "q1", prompt: "What is the result of 7 x 8?", options: ["54", "56", "64", "48"], correctIndex: 1 },
    { questionId: "q2", prompt: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correctIndex: 2 },
    { questionId: "q3", prompt: "What is the chemical symbol for water?", options: ["O2", "H2O", "CO2", "NaCl"], correctIndex: 1 },
    { questionId: "q4", prompt: "Who wrote 'Don Quixote'?", options: ["Gabriel García Márquez", "Miguel de Cervantes", "Pablo Neruda", "Jorge Luis Borges"], correctIndex: 1 },
    { questionId: "q5", prompt: "What is the capital of Colombia?", options: ["Medellín", "Cali", "Cartagena", "Bogotá"], correctIndex: 3 },
  ];
  await QuizQuestion.insertMany(questions);
}

async function createStudentWithClassroom() {
  const tag = `quiz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const studentUser = await User.create({
    name: `Student ${tag}`,
    email: `student_${tag}@x.co`,
    passwordHash: "h",
    role: "student",
  });

  const teacherUser = await User.create({
    name: `Teacher ${tag}`,
    email: `teacher_${tag}@x.co`,
    passwordHash: "h",
    role: "teacher",
  });

  const period = { startDate: new Date("2027-01-01T00:00:00Z"), endDate: new Date("2027-06-30T23:59:59Z"), periodId: new mongoose.Types.ObjectId() };
  const room = await Classroom.create({
    name: "Quiz Class",
    teacherId: teacherUser._id,
    joinCode: "ABC123",
    period,
    totalAssignments: 0,
  });

  studentUser.classroomId = room._id;
  await studentUser.save();

  const studentPet = await Pet.create({
    ownerId: studentUser._id,
    panchoId: "pancho-1",
    name: "Pancho",
    imgUrl: "https://images.dog.ceo/breeds/schipperke/n02104365_102.jpg",
    coins: 100,
    inventory: [],
    equipped: {},
    status: "alive",
    health: 100,
    hunger: 100,
    healthAdjustment: 0,
    healthRestoreLog: [],
    periodId: period.periodId,
    currentAssignmentSteps: [false, false, false, false],
    currentAssignmentStepsFor: "000000000000000000000001",
    lastMinigameAt: null,
  });

  return { student: studentUser, teacher: teacherUser, classroom: room, pet: studentPet };
}

describe("UN-501 · Quiz minigame grading on server", async () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    process.env.JWT_SECRET = "test-secret-un501";
    process.env.TEACHER_CODE = "TEACH123";
    process.env.NODE_ENV = "test";

    await connectDB();
    await Promise.all([User.init(), Pet.init(), QuizQuestion.init(), MinigamePlay.init(), Classroom.init()]);

    server = app.listen(0);

    await seedQuizQuestions();
    ({ student, teacher, classroom, pet } = await createStudentWithClassroom());
  });

  after(async () => {
    await server.close();
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await MinigamePlay.deleteMany({});
    await Pet.updateOne({ _id: pet._id }, { $set: { coins: 100, lastMinigameAt: null } });
  });

  // ---------- GET /api/minigames/quiz ----------
  it("GET /quiz -> 200, devuelve 5 preguntas SIN correctIndex", async () => {
    const res = await request(server).get("/api/minigames/quiz").set("Cookie", cookieOf(student));
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.questions));
    assert.equal(res.body.questions.length, 5);
    for (const q of res.body.questions) {
      assert.ok(q.id && q.prompt && Array.isArray(q.options));
      assert.equal(q.correctIndex, undefined, "correctIndex NO debe estar en la respuesta");
    }
  });

  it("GET /quiz sin sesión -> 401", async () => {
    const res = await request(server).get("/api/minigames/quiz");
    assert.equal(res.status, 401);
  });

  it("GET /quiz profesor -> 403", async () => {
    const res = await request(server).get("/api/minigames/quiz").set("Cookie", cookieOf(teacher));
    assert.equal(res.status, 403);
  });

  // ---------- POST /api/minigames/quiz/submit ----------
  it("POST /quiz/submit -> 200, 5 aciertos = 5 monedas, registra en minigame_plays", async () => {
    const answers = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 2 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 1 },
      { questionId: "q5", selectedIndex: 3 },
    ];
    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
    assert.equal(res.status, 200);
    assert.equal(res.body.reward, 5);
    assert.equal(res.body.correctCount, 5);
    assert.ok(res.body.gameState);
    assert.equal(res.body.playsToday, 1);
    assert.equal(res.body.maxPlaysPerDay, 10);

    const play = await MinigamePlay.findOne({ studentId: student._id });
    assert.ok(play);
    assert.equal(play.reward, 5);
    assert.equal(play.gameId, "quiz");
  });

  it("POST /quiz/submit -> 3 aciertos = 3 monedas", async () => {
    const answers = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 0 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 0 },
      { questionId: "q5", selectedIndex: 3 },
    ];
    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
    assert.equal(res.status, 200);
    assert.equal(res.body.reward, 3);
    assert.equal(res.body.correctCount, 3);
  });

  it("POST /quiz/submit -> 0 aciertos = 0 monedas (igual registra la partida)", async () => {
    const answers = [
      { questionId: "q1", selectedIndex: 0 },
      { questionId: "q2", selectedIndex: 0 },
      { questionId: "q3", selectedIndex: 0 },
      { questionId: "q4", selectedIndex: 0 },
      { questionId: "q5", selectedIndex: 0 },
    ];
    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
    assert.equal(res.status, 200);
    assert.equal(res.body.reward, 0);
    assert.equal(res.body.correctCount, 0);

    const play = await MinigamePlay.findOne({ studentId: student._id });
    assert.ok(play);
    assert.equal(play.reward, 0);
  });

  it("POST /quiz/submit -> tope de 5 monedas aunque acierte más (máx 5 preguntas)", async () => {
    const answers = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 2 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 1 },
      { questionId: "q5", selectedIndex: 3 },
    ];
    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
    assert.equal(res.status, 200);
    assert.equal(res.body.reward, 5);
  });

  it("POST /quiz/submit sin sesión -> 401", async () => {
    const res = await request(server).post("/api/minigames/quiz/submit").send({ answers: [] });
    assert.equal(res.status, 401);
  });

  it("POST /quiz/submit profesor -> 403", async () => {
    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(teacher)).send({ answers: [] });
    assert.equal(res.status, 403);
  });

  it("POST /quiz/submit estudiante sin Pancho -> 404", async () => {
    const tag = `nopet_${Date.now()}`;
    const noPetStudent = await User.create({
      name: "No Pet",
      email: `${tag}@x.co`,
      passwordHash: "h",
      role: "student",
      classroomId: classroom._id,
    });

    const answers = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 2 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 1 },
      { questionId: "q5", selectedIndex: 3 },
    ];
    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(noPetStudent)).send({ answers });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "NOT_FOUND");
  });

  it("POST /quiz/submit valida exactamente 5 respuestas", async () => {
    const res1 = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({
      answers: [
        { questionId: "q1", selectedIndex: 1 },
        { questionId: "q2", selectedIndex: 2 },
        { questionId: "q3", selectedIndex: 1 },
        { questionId: "q4", selectedIndex: 1 },
      ],
    });
    assert.equal(res1.status, 400);

    const res2 = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({
      answers: [
        { questionId: "q1", selectedIndex: 1 },
        { questionId: "q2", selectedIndex: 2 },
        { questionId: "q3", selectedIndex: 1 },
        { questionId: "q4", selectedIndex: 1 },
        { questionId: "q5", selectedIndex: 3 },
        { questionId: "q6", selectedIndex: 0 },
      ],
    });
    assert.equal(res2.status, 400);
  });

  it("POST /quiz/submit rechaza questionId duplicado", async () => {
    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({
      answers: [
        { questionId: "q1", selectedIndex: 1 },
        { questionId: "q1", selectedIndex: 1 },
        { questionId: "q3", selectedIndex: 1 },
        { questionId: "q4", selectedIndex: 1 },
        { questionId: "q5", selectedIndex: 3 },
      ],
    });
    assert.equal(res.status, 400);
  });

  it("POST /quiz/submit valida selectedIndex entero >= 0", async () => {
    const res1 = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({
      answers: [
        { questionId: "q1", selectedIndex: -1 },
        { questionId: "q2", selectedIndex: 2 },
        { questionId: "q3", selectedIndex: 1 },
        { questionId: "q4", selectedIndex: 1 },
        { questionId: "q5", selectedIndex: 3 },
      ],
    });
    assert.equal(res1.status, 400);

    const res2 = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({
      answers: [
        { questionId: "q1", selectedIndex: 1.5 },
        { questionId: "q2", selectedIndex: 2 },
        { questionId: "q3", selectedIndex: 1 },
        { questionId: "q4", selectedIndex: 1 },
        { questionId: "q5", selectedIndex: 3 },
      ],
    });
    assert.equal(res2.status, 400);
  });

  // ---------- Límites diarios y enfriamiento ----------
  it("POST /quiz/submit enfriamiento: segunda partida inmediata -> 429", async () => {
    const answers = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 2 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 1 },
      { questionId: "q5", selectedIndex: 3 },
    ];

    const r1 = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
    assert.equal(r1.status, 200);

    const r2 = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
    assert.equal(r2.status, 429);
    assert.equal(r2.body.error.code, "RATE_LIMITED");
  });

  it("POST /quiz/submit tope diario: partida 11 del día -> 429", async () => {
    const answers = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 2 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 1 },
      { questionId: "q5", selectedIndex: 3 },
    ];

    for (let i = 0; i < 10; i++) {
      await Pet.updateOne({ _id: pet._id }, { $set: { lastMinigameAt: null } });
      const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
      assert.equal(res.status, 200);
    }

    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
    assert.equal(res.status, 429);
    assert.equal(res.body.error.code, "RATE_LIMITED");
  });

  it("POST /quiz/submit peticiones simultáneas: solo una cobra (atomicidad)", async () => {
    const answers = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 2 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 1 },
      { questionId: "q5", selectedIndex: 3 },
    ];

    const promises = Array(5).fill().map(() => request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers }));
    const results = await Promise.all(promises);

    const ok = results.filter((r) => r.status === 200);
    const rateLimited = results.filter((r) => r.status === 429);
    assert.equal(ok.length, 1);
    assert.equal(rateLimited.length, 4);

    const plays = await MinigamePlay.countDocuments({ studentId: student._id });
    assert.equal(plays, 1);
  });

  it("POST /quiz/submit actualiza coins del Pet y devuelve gameState actualizado", async () => {
    const answers = [
      { questionId: "q1", selectedIndex: 1 },
      { questionId: "q2", selectedIndex: 2 },
      { questionId: "q3", selectedIndex: 1 },
      { questionId: "q4", selectedIndex: 1 },
      { questionId: "q5", selectedIndex: 3 },
    ];

    const res = await request(server).post("/api/minigames/quiz/submit").set("Cookie", cookieOf(student)).send({ answers });
    assert.equal(res.status, 200);
    assert.equal(res.body.reward, 5);

    const updatedPet = await Pet.findById(pet._id);
    assert.equal(updatedPet.coins, 105);

    assert.equal(res.body.gameState.student.coins, 105);
  });
});