# Submissions API

Status: implemented. Client: `src/lib/submissionApi.js`, `src/pages/homework/`. Server: `server/routes/assignments.js`,
`server/routes/me.js`, `server/routes/submissions.js`, `server/services/submissionService.js`,
`server/validators/assignment.js` and the models `Submission` and `SubmissionFile`. Tests: `server/tests/submissions.test.js`.
Decisions taken with the team: students may hand in **any** open assignment in **any order**; a missed
assignment still costs health (ADR 5.3 is unchanged); files are small and kept in MongoDB.

All errors use `{ "error": { "code", "message" } }` (ADR 7.6). Needs a session cookie.

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/api/assignments` | teacher, student | Already exists (UN-107). The student sees the whole list of the current period, ordered by `dueAt`. |
| GET | `/api/me/submissions` | student | `{ submissions: [{ id, assignmentId, kind, fileName, fileUrl, submittedAt }] }` |
| POST | `/api/assignments/:id/submissions` | student | Hand in one assignment. `201 { submission }` (same shape as above). |
| GET | `/api/assignments/:id/submissions` | teacher (owner) | `{ submissions: [{ id, assignmentId, student: { id, name }, kind, fileName, fileUrl, submittedAt }] }`, oldest first. Empty list when nobody handed in. |
| GET | `/api/submissions/:id/file` | owner student, teacher of the classroom | Returns the stored file with its `Content-Type` and `Content-Disposition: inline`. |

## POST body (one of)

```json
{ "kind": "link", "url": "https://docs.google.com/..." }
{ "kind": "file", "fileName": "tarea1.jpg", "mimeType": "image/jpeg", "dataBase64": "..." }
```

- `link`: `http:` or `https:` only, at most 2000 characters. Never any other protocol (`javascript:`, `data:`).
- `file`: `mimeType` is one of `image/jpeg`, `image/png`, `image/webp`, `application/pdf`; the decoded size is at
  most 3 MB (the client shrinks photos first); check the real bytes (magic numbers), not only the sent type.
  `express.json` needs a limit of about 4 MB for this route (the default is 100 kb).
- `fileName`: at most 120 characters, no path separators.

## Rules (server)

1. Student only (`403` for a teacher). A dead Pancho cannot hand in (`409 CONFLICT`, same as UN-302).
2. The assignment belongs to the student's classroom and current period (`404` / `403` otherwise).
3. The period has started and `now < dueAt`; after that `409 ASSIGNMENT_EXPIRED` (ADR 5.5: no late submissions).
4. One submission per assignment and student (unique `{ assignmentId, studentId }`): `409 CONFLICT` the second time.
5. This replaces the rule "only the active assignment can be submitted" of the 4-step flow (UN-302), for this route only.
   If the assignment handed in is the active one, also reset the steps and set hunger like `submitAssignment` does.
6. Missing submission after `dueAt` still counts as missed in `computePetState` (no change).

## Storage

New collection `submission_files` (`submissionId`, `mimeType`, `size`, `data` Buffer, `createdAt`), so the
`submissions` documents stay small. `submissions.fileUrl` is the link itself (kind `link`) or
`/api/submissions/:id/file` (kind `file`). `kind` is a new field of `submissions` (`"link"` or `"file"`).

## Errors

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad body, link, file name, base64, file type that does not match the real bytes, file over 3 MB, or an invalid id. |
| 401 | `UNAUTHORIZED` | No session. |
| 403 | `FORBIDDEN` | Wrong role, assignment of another classroom, or a file/list that is not yours. |
| 404 | `NOT_FOUND` | Unknown assignment, submission or file; assignment of a finished period; student without a Pancho. |
| 409 | `CONFLICT` | Dead Pancho, period not started yet, or the assignment was already handed in. |
| 409 | `ASSIGNMENT_EXPIRED` | `now >= dueAt`. |

The body limit of `POST /api/assignments/:id/submissions` is read after authentication, so only a logged-in
student can make the server read a body of about 4 MB. Every other route keeps the 10 kb limit.
