// Validation for the classroom endpoints (ADR 7.4). strictObject rejects unknown keys.
import { z } from "zod";

const name = z
  .string({ error: "name must be a string" })
  .trim()
  .min(1, "name is required")
  .max(100, "name must have at most 100 characters"); // same limit as Classroom.name

// Custom join code chosen by the teacher at creation time.
const customJoinCode = z
  .string({ error: "joinCode must be a string" })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{4,16}$/, "joinCode must have 4-16 characters: letters, digits or hyphen");

const isoDate = (field) => z.iso.datetime({ error: `${field} must be an ISO 8601 UTC date` });

const period = z
  .strictObject({ startDate: isoDate("startDate"), endDate: isoDate("endDate") })
  .refine((value) => new Date(value.endDate) > new Date(value.startDate), {
    path: ["endDate"],
    message: "endDate must be after startDate",
  });

// POST /api/classrooms
export const createClassroomSchema = z.strictObject({
  name,
  joinCode: customJoinCode.optional(),
  period,
});

// PATCH /api/classrooms/:id
export const renameClassroomSchema = z.strictObject({ name });

// POST /api/classrooms/join
// Deliberately loose: any well-formed string that matches no classroom must give
// 404 NOT_FOUND (not 400), so only length is checked here.
export const joinClassroomSchema = z.strictObject({
  joinCode: z
    .string({ error: "joinCode must be a string" })
    .trim()
    .min(1, "joinCode is required")
    .max(32, "joinCode is too long")
    .toUpperCase(),
});

// POST /api/classrooms/:id/students/:studentId/restore-health (UN-108, ADR Rev. 2.3).
// `points` omitted = restore everything that was lost. `reason` is mandatory and is logged.
export const restoreHealthSchema = z.strictObject({
  points: z
    .number({ error: "points must be a number" })
    .positive("points must be greater than 0")
    .max(100, "points cannot be more than 100")
    .optional(),
  reason: z
    .string({ error: "reason must be a string" })
    .trim()
    .min(3, "reason must have at least 3 characters")
    .max(200, "reason must have at most 200 characters"),
});

// GET /api/classrooms/:id/students/:studentId/submissions - teacher fetches all submissions for a student
export const studentSubmissionsParamsSchema = z.strictObject({
  id: z.string({ error: "id must be a string" }).min(1),
  studentId: z.string({ error: "studentId must be a string" }).min(1),
});
