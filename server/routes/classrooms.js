// Classroom routes (UN-106), mounted in app.js under /api/classrooms.
// Express 5 forwards errors thrown in async handlers to the error handler.
import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateIds } from "../middleware/validateIds.js";
import { joinRateLimit } from "../middleware/authRateLimit.js";
import {
  createClassroomSchema,
  renameClassroomSchema,
  joinClassroomSchema,
  restoreHealthSchema,
  studentSubmissionsParamsSchema,
} from "../validators/classroom.js";
import {
  assignMinigameSchema,
  minigameAssignmentParamsSchema,
} from "../validators/minigames.js";
import * as service from "../services/classroomService.js";
import { listStudentSubmissions } from "../services/classroomService.js";
import {
  assignMinigame,
  listAssignedMinigames,
  removeMinigameAssignment,
  getClassroomMinigamePlays,
} from "../services/minigameService.js";
import { restoreHealth } from "../services/healthRestoreService.js";
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
  if (!classroom) throw new AppError(404, "NOT_FOUND", "You do not belong to a classroom yet");
  res.status(200).json({ classroom: service.toClassroomJson(classroom) });
});

// POST /api/classrooms/join -> 201 first time, 200 if the student was already in it
router.post("/join", studentOnly, joinRateLimit, validateBody(joinClassroomSchema), async (req, res) => {
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

// GET /api/classrooms/:id/students/:studentId/submissions -> 200
// Teacher fetches all submissions for a specific student in their classroom
router.get(
  "/:id/students/:studentId/submissions",
  teacherOnly,
  validateIds("id", "studentId"),
  async (req, res) => {
    const result = await listStudentSubmissions(req.user, req.params.id, req.params.studentId);
    res.status(200).json(result);
  }
);

// DELETE /api/classrooms/:id/students/:studentId -> 200
// POST /api/classrooms/:id/students/:studentId/restore-health -> 200 (UN-108, Rev. 2.3)
router.post(
  "/:id/students/:studentId/restore-health",
  teacherOnly,
  validateIds("id", "studentId"),
  validateBody(restoreHealthSchema),
  async (req, res) => {
    res.status(200).json(await restoreHealth(req.user, req.params.id, req.params.studentId, req.body));
  }
);

router.delete("/:id/students/:studentId", teacherOnly, validateIds("id", "studentId"), async (req, res) => {
  await service.removeStudent(req.user, req.params.id, req.params.studentId);
  res.status(200).json({ removed: true, studentId: req.params.studentId });
});

// POST /api/classrooms/:id/minigames/assign -> 201 (teacher assigns minigame to classroom)
router.post(
  "/:id/minigames/assign",
  teacherOnly,
  validateIds("id"),
  validateBody(assignMinigameSchema),
  async (req, res) => {
    const assignment = await assignMinigame(req.user, req.params.id, req.body.minigameId);
    res.status(201).json({ assignment });
  }
);

// GET /api/classrooms/:id/minigames -> 200 (teacher lists assigned minigames)
router.get(
  "/:id/minigames",
  teacherOnly,
  validateIds("id"),
  async (req, res) => {
    const assignments = await listAssignedMinigames(req.user, req.params.id);
    res.status(200).json({ assignments });
  }
);

// DELETE /api/classrooms/:id/minigames/:assignmentId -> 200 (teacher removes assignment)
router.delete(
  "/:id/minigames/:assignmentId",
  teacherOnly,
  validateIds("id", "assignmentId"),
  async (req, res) => {
    await removeMinigameAssignment(req.user, req.params.id, req.params.assignmentId);
    res.status(200).json({ removed: true });
  }
);

// GET /api/classrooms/:id/minigames/plays -> 200 (teacher views student minigame completions)
router.get(
  "/:id/minigames/plays",
  teacherOnly,
  validateIds("id"),
  async (req, res) => {
    const plays = await getClassroomMinigamePlays(req.user, req.params.id);
    res.status(200).json({ plays });
  }
);

export default router;