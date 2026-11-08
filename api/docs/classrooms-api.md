# Classrooms API (UN-106)

Base path: `/api/classrooms`. All routes need a session cookie (ADR 5.2). Errors always use
`{ "error": { "code", "message" } }` (ADR 7.6). Code: `server/routes/classrooms.js`
(routes), `server/services/classroomService.js` (logic), `server/validators/classroom.js`.

## Endpoints

| Method | Path | Role | Success | Notes |
|---|---|---|---|---|
| POST | `/api/classrooms` | teacher | 201 | Body: `{ name, period: { startDate, endDate }, joinCode? }`. Code is generated if omitted. |
| GET | `/api/classrooms` | any | 200 | Teacher: the classroom they own. Student: the one they joined. Returns `{ classrooms: [...] }` (0 or 1 items today, see below). |
| PATCH | `/api/classrooms/:id` | teacher (owner) | 200 | Body: `{ name }`. |
| DELETE | `/api/classrooms/:id` | teacher (owner) | 200 | Returns `{ deleted: true, classroomId, unenrolledStudents }`. See delete policy. |
| POST | `/api/classrooms/join` | student | 201 / 200 | Body: `{ joinCode }`. 201 the first time, 200 with `alreadyJoined: true` if repeated. |
| GET | `/api/classrooms/:id/students` | teacher (owner) | 200 | `{ students: [{ id, name, email, pet: { status, health, hunger } \| null }] }`. |
| DELETE | `/api/classrooms/:id/students/:studentId` | teacher (owner) | 200 | Returns `{ removed: true, studentId }`. |

## Rules

- **Join code:** 6 characters, uppercase letters and digits, without `0 O 1 I L`. Generated
  with `crypto.randomInt`; a collision is retried up to 5 times. A teacher may send their
  own code (4-16 chars: `A-Z`, `0-9`, `-`); it is stored uppercase and a duplicate gives `409`.
  Uniqueness is guaranteed by the unique index on `joinCode`, not only by the check.
- **Unknown code:** `POST /join` returns `404 NOT_FOUND`. Codes are case-insensitive.
- **Joining twice:** idempotent. The second call changes nothing (no second enrollment, no
  second pet) and returns `200`. Joining a *different* classroom while enrolled gives `409`.
- **Ownership:** a missing classroom is `404`; one that belongs to another teacher is `403`.
- **One classroom per teacher** (unique `teacherId`, ADR 5.6): creating a second gives `409`.
  This is why "list" returns at most one item for a teacher.
- **Pets on join:** the first join creates the student's Pancho (`health 100`, `hunger 100`,
  `alive`, 270 coins). Rejoining the *same* classroom leaves the pet untouched, so leaving and
  rejoining never revives a dead Pancho (ADR 5.4). Joining a classroom with a different
  period starts a new cycle (health/hunger/status reset; coins are kept).

## Delete policy (classroom with students)

Deleting a classroom:

1. Unenrolls every student (`users.classroomId = null`) and clears the teacher's `classroomId`.
2. **Does not delete pets.** Each student keeps their Pancho, coins and cosmetics.
3. **Does not delete assignments or submissions.** They stay in the database, unreachable
   through the API (see open decisions).
4. Deletes the classroom document last, so a failed request can be retried safely.

Removing one student does the same for that student: `classroomId = null`, pet kept.
The response of the delete reports how many students were unenrolled.

## Assumptions to confirm

- **Auth is a temporary stand-in.** UN-104 (login) and UN-105 (auth middleware) are not in
  the repo. `server/utils/jwt.js` and `server/middleware/authenticate.js` read an HS256 token
  signed with `JWT_SECRET` from a cookie named `session` (payload `{ sub: <userId> }`).
  Replace both files when UN-104/UN-105 land; the routes only use `authenticate` and
  `authorize(role)`.
- **Initial coins (270)** is the prototype value; ADR section 12 leaves it open.
- **Join code format** is a proposal; ADR section 12 leaves it open.
- **API messages are in English**, as requested. ADR 7.6 says validation messages are in
  Spanish, so this differs from the existing handlers.
- `health`/`hunger` in the students list are the stored snapshot, not the value reconciled
  at request time (ADR 5.3). That reconciliation belongs to the pet/game-state tickets.

## Open decisions

- What happens to a classroom's assignments and submissions when it is deleted (kept
  orphaned today, to avoid destroying student work).
- Whether a student who joins after the period started inherits already-missed tasks
  (ADR section 12).

## Verifying

```
node server/scripts/verify-un106.js --offline   # no database: validation, auth, roles
node server/scripts/verify-un106.js             # full: needs MONGODB_URI, covers every criterion
```
The full run creates temporary users and classrooms and deletes them at the end.
