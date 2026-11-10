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
