// Submission routes, mounted in app.js under /api/submissions (docs/submissions-api.md).
// The list and hand-in routes live next to their assignment (routes/assignments.js) and the
// student's own list under /api/me; this file only serves the stored file.
import { Router } from "express";
import { validateIds } from "../middleware/validateIds.js";
import { getSubmissionFile } from "../services/submissionService.js";

const router = Router();

// Header-safe name: plain ASCII fallback plus the real name encoded as RFC 5987.
function inlineDisposition(fileName) {
  const fallback = fileName.replace(/[^\x20-\x7e]|["\\%;]/g, "_");
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

// GET /api/submissions/:id/file -> the stored file (owner student, or teacher of the classroom)
router.get("/:id/file", validateIds("id"), async (req, res) => {
  const { fileName, mimeType, data } = await getSubmissionFile(req.user, req.params.id);
  res.set({
    "Content-Type": mimeType,
    "Content-Length": String(data.length),
    "Content-Disposition": inlineDisposition(fileName),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  });
  res.status(200).send(data);
});

export default router;
