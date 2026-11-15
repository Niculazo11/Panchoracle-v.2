// Assignment routes (UN-107), mounted in app.js under /api/assignments.
// Teachers create, edit and delete; students and teachers of the classroom can read.
// Express 5 forwards errors thrown in async handlers to the error handler.
import { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateIds } from "../middleware/validateIds.js";
import { createAssignmentSchema, updateAssignmentSchema } from "../validators/assignment.js";
import * as service from "../services/assignmentService.js";

const router = Router();
const teacherOnly = authorize("teacher");

// GET /api/assignments -> 200 { assignments } (current period, ordered by dueAt)
router.get("/", async (req, res) => {
  const assignments = await service.listAssignments(req.user);
  res.status(200).json({ assignments: assignments.map(service.toAssignmentJson) });
});

// POST /api/assignments -> 201 { assignment }
router.post("/", teacherOnly, validateBody(createAssignmentSchema), async (req, res) => {
  const assignment = await service.createAssignment(req.user, req.body);
  res.status(201).json({ assignment: service.toAssignmentJson(assignment) });
});

// GET /api/assignments/:id -> 200 { assignment }
router.get("/:id", validateIds("id"), async (req, res) => {
  const assignment = await service.getAssignment(req.user, req.params.id);
  res.status(200).json({ assignment: service.toAssignmentJson(assignment) });
});

// PATCH /api/assignments/:id -> 200 { assignment }
router.patch("/:id", teacherOnly, validateIds("id"), validateBody(updateAssignmentSchema), async (req, res) => {
  const assignment = await service.updateAssignment(req.user, req.params.id, req.body);
  res.status(200).json({ assignment: service.toAssignmentJson(assignment) });
});

// DELETE /api/assignments/:id -> 200 { deleted: true, assignmentId }
router.delete("/:id", teacherOnly, validateIds("id"), async (req, res) => {
  const result = await service.deleteAssignment(req.user, req.params.id);
  res.status(200).json({ deleted: true, ...result });
});

export default router;
