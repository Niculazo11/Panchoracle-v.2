// Validation for the assignment endpoints (ADR 7.4). strictObject rejects unknown keys.
// Text is stored as sent (only trimmed): a title like "<script>" is plain text, and the
// client is the one that escapes it when rendering (UN-107, RNF-2).
import { z } from "zod";
import {
  ALLOWED_MIME_TYPES,
  MAX_BASE64_LENGTH,
  MAX_FILE_NAME_LENGTH,
  MAX_LINK_LENGTH,
} from "../config/submissions.js";

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


// ---------------------------------------------------------------------------
// POST /api/assignments/:id/submissions (docs/submissions-api.md). One of:
//   { kind: "link", url }
//   { kind: "file", fileName, mimeType, dataBase64 }
// Here only the shape is checked. The real bytes (magic numbers) and the decoded size are checked
// by the service, which has the decoded buffer.
// ---------------------------------------------------------------------------

// Only http: and https: links. Never javascript:, data:, file: or anything else.
const url = z
  .string({ error: "url must be a string" })
  .trim()
  .min(1, "url is required")
  .max(MAX_LINK_LENGTH, `url must have at most ${MAX_LINK_LENGTH} characters`)
  .refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "url must be a valid http or https link");

// No path separators and no control characters, so the name is safe to store and to show.
const fileName = z
  .string({ error: "fileName must be a string" })
  .trim()
  .min(1, "fileName is required")
  .max(MAX_FILE_NAME_LENGTH, `fileName must have at most ${MAX_FILE_NAME_LENGTH} characters`)
  .refine((value) => !/[\\/]/.test(value), "fileName must not contain path separators")
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "fileName must not contain control characters");

// The limit here only stops absurdly long strings early; the decoded size is checked by the service.
const dataBase64 = z
  .string({ error: "dataBase64 must be a string" })
  .min(1, "dataBase64 is required")
  .max(MAX_BASE64_LENGTH, "The file is too big. The limit is 3 MB.")
  .refine((value) => value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value), "dataBase64 is not valid base64");

const linkSubmission = z.strictObject({ kind: z.literal("link"), url });

const fileSubmission = z.strictObject({
  kind: z.literal("file"),
  fileName,
  mimeType: z.enum(ALLOWED_MIME_TYPES, { error: "mimeType must be image/jpeg, image/png, image/webp or application/pdf" }),
  dataBase64,
});

export const createSubmissionSchema = z.discriminatedUnion("kind", [linkSubmission, fileSubmission], {
  error: "kind must be link or file",
});
