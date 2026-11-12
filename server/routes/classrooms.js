// Classroom routes (UN-106), mounted in app.js under /api/classrooms.
// Express 5 forwards errors thrown in async handlers to the error handler.
import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateIds } from "../middleware/validateIds.js";
import {
  createClassroomSchema,
  renameClassroomSchema,
  joinClassroomSchema,
} from "../validators/classroom.js";
import * as service from "../services/classroomService.js";
import AppError from "../utils/AppError.js";

const router = Router();
const teacherOnly = authorize("teacher");
const studentOnly = authorize("student");

// POST /api/classrooms -> 201
router.post("/", teacherOnly, validateBody(createClassroomSchema), async (req, res) => {
  const classroom = await service.createClassroom(req.user, req.body);
  res.status(201).json({ classroom: service.toClassroomJson(classroom) });
});

// GET /api/classrooms/me -> 200 { classroom } | 404 (ADR 7.3)
router.get("/me", async (req, res) => {
  const [classroom] = await service.listClassrooms(req.user);
  if (!classroom) throw new AppError(404, "NOT_FOUND", "Aún no perteneces a un classroom");
  res.status(200).json({ classroom: service.toClassroomJson(classroom) });
});

// POST /api/classrooms/join -> 201 first time, 200 if the student was already in it
router.post("/join", studentOnly, validateBody(joinClassroomSchema), async (req, res) => {
  const result = await service.joinClassroom(req.user, req.body.joinCode);
  res
    .status(result.alreadyJoined ? 200 : 201)
    .json({ classroom: service.toClassroomJson(result.classroom), alreadyJoined: result.alreadyJoined });
});

// PATCH /api/classrooms/:id -> 200
router.patch("/:id", teacherOnly, validateIds("id"), validateBody(renameClassroomSchema), async (req, res) => {
  const classroom = await service.renameClassroom(req.user, req.params.id, req.body.name);
  res.status(200).json({ classroom: service.toClassroomJson(classroom) });
});

// DELETE /api/classrooms/:id -> 200 with a summary
router.delete("/:id", teacherOnly, validateIds("id"), async (req, res) => {
  const result = await service.deleteClassroom(req.user, req.params.id);
  res.status(200).json({ deleted: true, ...result });
});

// GET /api/classrooms/:id/students -> 200
router.get("/:id/students", teacherOnly, validateIds("id"), async (req, res) => {
  const students = await service.listStudents(req.user, req.params.id);
  res.status(200).json({ students });
});

// DELETE /api/classrooms/:id/students/:studentId -> 200
router.delete("/:id/students/:studentId", teacherOnly, validateIds("id", "studentId"), async (req, res) => {
  await service.removeStudent(req.user, req.params.id, req.params.studentId);
  res.status(200).json({ removed: true, studentId: req.params.studentId });
});

export default router;
