// Limits of the submissions API (docs/submissions-api.md). Shared by the validator, the service
// and app.js, so the numbers live in one place.

// Decoded size of an uploaded file: 3 MB at most (the client shrinks photos first).
export const MAX_FILE_BYTES = 3 * 1024 * 1024;

// base64 turns every 3 bytes into 4 characters, so a file of exactly MAX_FILE_BYTES is this long.
export const MAX_BASE64_LENGTH = Math.ceil(MAX_FILE_BYTES / 3) * 4;

// Limit of the JSON body of the hand-in route (about 4 MB): the longest base64 string plus
// room for the rest of the JSON (kind, fileName, mimeType, quotes and escapes).
export const SUBMISSION_BODY_LIMIT = MAX_BASE64_LENGTH + 16 * 1024;

export const MAX_LINK_LENGTH = 2000;
export const MAX_FILE_NAME_LENGTH = 120;

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// POST /api/assignments/:id/submissions is the only route that needs the big body limit.
export const SUBMISSION_UPLOAD_PATH = /^\/api\/assignments\/[0-9a-fA-F]{24}\/submissions\/?$/;
export function isSubmissionUpload(req) {
  return req.method === "POST" && SUBMISSION_UPLOAD_PATH.test(req.path);
}
