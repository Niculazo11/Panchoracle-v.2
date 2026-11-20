// Assignment routes (UN-107), mounted in app.js under /api/assignments.
// Teachers create, edit and delete; students and teachers of the classroom can read.
// Students hand in a link or a file (docs/submissions-api.md). Teachers read what was handed in.
// Express 5 forwards errors thrown in async handlers to the error handler.
import express, { Router } from "express";
import { authorize } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validateBody.js";
import { validateIds } from "../middleware/validateIds.js";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  createSubmissionSchema,
} from "../validators/assignment.js";
import { SUBMISSION_BODY_LIMIT } from "../config/submissions.js";
import * as service from "../services/assignmentService.js";
import * as submissions from "../services/submissionService.js";

const router = Router();
const teacherOnly = authorize("teacher");
const studentOnly = authorize("student");

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

// GET /api/assignments/:id/submissions -> 200 { submissions } oldest first (teacher who owns the classroom)
router.get("/:id/submissions", teacherOnly, validateIds("id"), async (req, res) => {
  res.status(200).json({ submissions: await submissions.listAssignmentSubmissions(req.user, req.params.id) });
});

// POST /api/assignments/:id/submissions -> 201 { submission } (student hand-in of a link or a file)
// app.js leaves this route out of the small global JSON parser, so the bigger limit is applied
// here, AFTER authentication and the role check: nobody without a student session can make the
// server read a 4 MB body.
router.post(
  "/:id/submissions",
  studentOnly,
  validateIds("id"),
  express.json({ limit: SUBMISSION_BODY_LIMIT }),
  validateBody(createSubmissionSchema),
  async (req, res) => {
    const submission = await submissions.handInAssignment(req.user, req.params.id, req.body);
    res.status(201).json({ submission: submissions.toSubmissionJson(submission) });
  }
);

export default router;