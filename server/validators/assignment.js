// Validation for the assignment endpoints (ADR 7.4). strictObject rejects unknown keys.
// Text is stored as sent (only trimmed): a title like "<script>" is plain text, and the
// client is the one that escapes it when rendering (UN-107, RNF-2).
import { z } from "zod";

const title = z
  .string({ error: "title must be a string" })
  .trim()
  .min(1, "title is required")
  .max(120, "title must have at most 120 characters"); // same limit as Assignment.title

const description = z
  .string({ error: "description must be a string" })
  .trim()
  .max(2000, "description must have at most 2000 characters"); // same limit as Assignment.description

const dueAt = z.iso.datetime({ error: "dueAt must be an ISO 8601 UTC date" });

// POST /api/assignments
export const createAssignmentSchema = z.strictObject({
  title,
  description: description.optional(),
  dueAt,
});

// PATCH /api/assignments/:id (at least one field)
export const updateAssignmentSchema = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    dueAt: dueAt.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "send at least one of: title, description, dueAt",
  });

// POST /api/assignments/:id/steps - complete step 1, 2 or 3
export const completeStepSchema = z.strictObject({
  stepId: z.number().int().min(1, "stepId must be at least 1").max(3, "stepId must be at most 3"),
});

// POST /api/assignments/:id/submit - no body needed, validation happens in service
// Accept undefined (no body) or empty object
export const submitAssignmentSchema = z.union([z.strictObject({}), z.undefined()]);
