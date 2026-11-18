# Panchoracle API reference

Single index for every endpoint that exists in `server/routes/*.js`. Source of truth: the routes, the `zod` validators in `server/validators/*.js`, the service serializers and the tests in `server/tests/`. Detailed guides: [`classrooms-api.md`](./classrooms-api.md), [`game-api.md`](./game-api.md), [`usePolling.md`](./usePolling.md), [`ADR-001-api-mongodb.md`](./ADR-001-api-mongodb.md).

## Conventions

| Topic | Rule |
|---|---|
| Base URL | `/api` on the same origin as the front end (local API: `http://localhost:3000`). |
| Authentication | `httpOnly` cookie `session` (JWT HS256, 1 h) set by `register`/`login`. There is **no** `Authorization` header. |
| Role | Read from the database on every request, never from the client. |
| Content type | `application/json`; body limit 10 kB (larger bodies get `400`); unknown fields are rejected (`zod` `strictObject`); keys starting with `$` are stripped before validation. |
| Origin policy | A request whose `Origin` is not the same host, `localhost` (outside Vercel) or in `ALLOWED_ORIGINS` gets `403 FORBIDDEN`. |
| IDs | MongoDB ObjectIds as 24-character hex strings; an invalid id returns `400`. |
| Dates | ISO 8601 UTC strings, for example `2026-12-20T00:00:00.000Z`. |
| Secrets | `passwordHash` is removed from every JSON response. |

### Error format

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

| HTTP | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid body, id, field type, NoSQL operator, malformed JSON or body over 10 kB. |
| 401 | `UNAUTHORIZED` | Missing, invalid or expired session; wrong credentials. |
| 403 | `FORBIDDEN` | Wrong role, resource of another classroom or teacher, foreign origin, invalid teacher code. |
| 404 | `NOT_FOUND` | Resource or route does not exist. |
| 409 | `CONFLICT`, `ASSIGNMENT_EXPIRED`, `PERIOD_LOCKED` | State conflict (duplicate, expired assignment, period already started). |
| 429 | `RATE_LIMITED` | Too many attempts or minigame limit; login/register/join also send `Retry-After` (seconds). |
| 500 | `INTERNAL_ERROR` | Unexpected error (the quiz also uses `SERVER_ERROR` when `quiz_questions` does not hold 5 questions: re-run the seed). |
| 503 | `SERVICE_UNAVAILABLE` | Database unreachable. |

### Shared shapes

```jsonc
// user (register, login, me)
{ "id": "...", "name": "Ana Demo", "email": "ana@seed.panchoracle.test", "role": "student", "classroomId": "..." /* or null */, "createdAt": "..." }

// classroom
{ "id": "...", "name": "Demo Classroom", "teacherId": "...", "joinCode": "SEED42",
  "period": { "periodId": "...", "startDate": "...", "endDate": "...", "totalAssignments": 5 }, "createdAt": "..." }

// assignment
{ "id": "...", "classroomId": "...", "periodId": "...", "title": "...", "description": "...", "dueAt": "...", "createdAt": "..." }

// game state (every game route and /api/me/game)
{ "student": { "id": "Ana Demo", "userId": "...", "coins": 270, "inventory": [1, 6], "assignmentsCompleted": 3 },
  "dog": { "id": "n02085620_10074", "name": "Pancho", "imgUrl": "https://images.dog.ceo/...", "health": 80, "hunger": 30,
           "status": "ALIVE", "equippedCosmetics": { "head": 1, "face": null, "neck": null, "body": null } },
  "currentAssignment": { "id": "...", "title": "...", "description": "...", "dueAt": "...",
                         "steps": [ { "id": 1, "label": "Go for a Walk (Research)", "completed": false } ] } }
```

`dog.status` is upper case in this response (client compatibility); the database stores `alive`/`dead`. `health` and `hunger` are recalculated from the server clock on every read (ADR 5.3).

### Curl setup

```bash
API=http://localhost:3000
# Log in once; later calls reuse the cookie jar (-b) and refresh it (-c).
curl -s -c cookies.txt -X POST $API/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@seed.panchoracle.test","password":"<SEED_PASSWORD>"}'
```

Role legend: **Public** (no session), **Any** (any logged-in user), **Student**, **Teacher**.

---

## Health

### `GET /api/health` — Public

Pings MongoDB.

```bash
curl -i $API/api/health
```

```json
{ "status": "ok", "database": "connected", "timestamp": "2026-11-17T15:00:00.000Z" }
```

`503` with `{ "status": "degraded", "database": "disconnected", ... }` when the database does not answer.

---

## Authentication

### `POST /api/auth/register` — Public (rate limited)

Request: `{ "name": "Ana", "email": "ana@example.com", "password": "Secret123", "role": "student" }`. `name` 2–80 characters, `password` 6–128 characters, `role` is `student` or `teacher`. For `teacher` add `"teacherCode": "<TEACHER_CODE>"`.

Response `201`: `{ "user": { ... } }` and the `session` cookie. Errors: `400`, `403` (invalid teacher code), `409` (email already registered), `429` (30 attempts per hour per IP and email).

```bash
curl -i -c cookies.txt -X POST $API/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@example.com","password":"Secret123","role":"student"}'
```

### `POST /api/auth/login` — Public (rate limited)

Request: `{ "email": "ana@example.com", "password": "Secret123" }`. Response `200`: `{ "user": { ... } }` and the `session` cookie (`HttpOnly; SameSite=Lax`, plus `Secure` on Vercel/production).

Errors: `400` (operator objects such as `{"$ne":null}`), `401` `Credenciales inválidas` (same answer for unknown email and wrong password), `429` with `Retry-After` after 5 attempts per IP and email in 15 minutes.

```bash
curl -i -c cookies.txt -X POST $API/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Secret123"}'
```

### `POST /api/auth/logout` — Public

Clears the cookie. Response `204`, no body. The JWT is stateless: a copied token stays valid until it expires.

```bash
curl -i -b cookies.txt -c cookies.txt -X POST $API/api/auth/logout
```

---

## Current user

### `GET /api/me` — Any

Response `200`: `{ "user": { ... } }`. Error: `401`.

```bash
curl -s -b cookies.txt $API/api/me
```

### `GET /api/me/game` — Student

Response `200`: the game state. Errors: `401`, `403` (teacher), `404` (student who has not joined a classroom, so has no Pancho).

```bash
curl -s -b cookies.txt $API/api/me/game
```

---

## Classrooms

Full guide: [`classrooms-api.md`](./classrooms-api.md). A teacher owns at most one classroom.

| Method and path | Role | Request | Success |
|---|---|---|---|
| `POST /api/classrooms` | Teacher | `{ "name": "...", "period": { "startDate": "<ISO>", "endDate": "<ISO>" }, "joinCode"?: "ABCD-12" }` (`endDate` after `startDate`; custom code 4–16 chars `A-Z 0-9 -`) | `201 { "classroom": { ... } }` |
| `GET /api/classrooms/me` | Any | — | `200 { "classroom": { ... } }`, `404` if the user has none |
| `POST /api/classrooms/join` | Student (rate limited: 20 per 15 min) | `{ "joinCode": "SEED42" }` (case-insensitive) | `201` first time, `200` if already joined: `{ "classroom": { ... }, "alreadyJoined": false }` |
| `PATCH /api/classrooms/:id` | Teacher (owner) | `{ "name": "New name" }` | `200 { "classroom": { ... } }` |
| `DELETE /api/classrooms/:id` | Teacher (owner) | — | `200 { "deleted": true, "classroomId": "...", "unenrolledStudents": 3 }` |
| `GET /api/classrooms/:id/students` | Teacher (owner) | — | `200 { "students": [ { "id", "name", "email", "pet": { "status", "health", "hunger" } or null } ] }`. With `ENABLE_STUDENT_LIST_PET_METADATA=true` (flag `enable_student_list_pet_metadata`, off by default) `pet` also has `dogId`, `breed`, `imgUrl` and `cosmetics: { head, face, neck, body }` (all `null` when unset). See `classrooms-api.md`. |
| `POST /api/classrooms/:id/students/:studentId/restore-health` | Teacher (owner) | `{ "points"?: 20, "reason": "Medical excuse" }` (`points` 0–100, `reason` 3–200 chars) | `200 { "restored": 20, "student": { "id", "name" }, "pet": { "status", "health", "hunger", "healthAdjustment" } }` |
| `DELETE /api/classrooms/:id/students/:studentId` | Teacher (owner) | — | `200 { "removed": true, "studentId": "..." }` |

Common errors: `401` no session; `403` wrong role or classroom of another teacher; `404` unknown classroom or code, or student not enrolled; `409` second classroom for a teacher, duplicate join code, student already enrolled elsewhere; `429` too many join attempts.

`restore-health` only works on a **living** Pancho (there is no revive): `409` if it is dead, has no lost health, or `points` exceeds what was lost; `PERIOD_LOCKED` if the Pancho belongs to a finished period. Deleting a classroom unenrolls its students but keeps their pets. Join codes generated by the server have 6 characters and never contain `0`, `O`, `1`, `I` or `L`. The first join creates the student's Pancho with 270 coins.

```bash
curl -s -b cookies.txt -X POST $API/api/classrooms/join -H "Content-Type: application/json" -d '{"joinCode":"SEED42"}'
curl -s -b cookies.txt $API/api/classrooms/me
curl -s -b cookies.txt -X POST $API/api/classrooms/<classroomId>/students/<studentId>/restore-health \
  -H "Content-Type: application/json" -d '{"points":20,"reason":"Medical excuse"}'
```

---

## Assignments

Assignments belong to the current period of a classroom. Create/edit/delete only work **before** the period starts (`409 PERIOD_LOCKED` afterwards).

| Method and path | Role | Request | Success |
|---|---|---|---|
| `GET /api/assignments` | Student, Teacher | — | `200 { "assignments": [ ... ] }` ordered by `dueAt` |
| `POST /api/assignments` | Teacher | `{ "title": "Workshop 1", "description"?: "...", "dueAt": "<ISO>" }` (`title` ≤ 120, `description` ≤ 2000) | `201 { "assignment": { ... } }` |
| `GET /api/assignments/:id` | Student, Teacher (same classroom) | — | `200 { "assignment": { ... } }` |
| `PATCH /api/assignments/:id` | Teacher (owner) | at least one of `title`, `description`, `dueAt` | `200 { "assignment": { ... } }` |
| `DELETE /api/assignments/:id` | Teacher (owner) | — | `200 { "deleted": true, "assignmentId": "..." }` |
| `POST /api/assignments/:id/steps` | Student | `{ "stepId": 1 }` (1–3) | `200 { "success": true, "step": { "id": 1, "completed": true }, "state": { ... } }` |
| `POST /api/assignments/:id/submit` | Student | none or `{}` | `200 { "success": true, "rewards": { "hunger": 70 }, "state": { ... } }`; hunger returns to 100 |

`dueAt` must be inside the period and unique per classroom. A title such as `<script>` is stored and returned as plain text; the client escapes it when rendering.

Errors: `400` invalid body, date or id, or a `stepId` outside 1–3; `403` wrong role or another classroom's assignment; `404` unknown assignment; `409` duplicate `dueAt`, `PERIOD_LOCKED`, step already completed, a dead Pancho, submit without steps 1–3, or submitted twice.

```bash
curl -s -b cookies.txt -X POST $API/api/assignments -H "Content-Type: application/json" \
  -d '{"title":"Workshop 1","description":"Exercises 1-5","dueAt":"2026-12-20T00:00:00.000Z"}'
curl -s -b cookies.txt -X POST $API/api/assignments/<assignmentId>/steps -H "Content-Type: application/json" -d '{"stepId":1}'
curl -s -b cookies.txt -X POST $API/api/assignments/<assignmentId>/submit
```

---

## Game and minigames

Every game route returns the whole game state unless noted. See [`game-api.md`](./game-api.md). A student without a Pancho gets `404` (join a classroom first); a teacher gets `403`.

| Method and path | Role | Request | Success |
|---|---|---|---|
| `GET /api/cosmetics` | Any | — | `200 { "cosmetics": [ { "id", "name", "category", "cost", "image" } ] }` |
| `PUT /api/pets/me/pancho` | Student | `{ "panchoId": "n02085620_10074", "imgUrl": "https://images.dog.ceo/breeds/dachshund/n02085620_10074.jpg" }` | `200` (adopt / change dog; health and hunger untouched) |
| `POST /api/pets/me/inventory` | Student | `{ "cosmeticId": 3 }` (positive integer) | `201` (buys; deducts coins) |
| `PUT /api/pets/me/equipped` | Student | one or more of `head`, `face`, `neck`, `body`: cosmetic id or `null` to unequip | `200` |
| `GET /api/minigames/quiz` | Student | — | `200 { "questions": [ { "id", "prompt", "options" } ] }` (5 questions, no `correctIndex`) |
| `POST /api/minigames/quiz/submit` | Student | `{ "answers": [ { "questionId": "q1", "selectedIndex": 0 }, ... ] }` (exactly 5, distinct `questionId`) | `200 { "reward", "correctCount", "gameState", "playsToday", "maxPlaysPerDay" }` |

Validation: `panchoId` matches `^[A-Za-z0-9._-]+$` (max 100); `imgUrl` must match `^https://images\.dog\.ceo/[A-Za-z0-9/_.-]+$` (max 500).

Errors: `400` validation, or an equipped cosmetic that does not fit the slot; `404` unknown cosmetic; `409` cosmetic already owned, not enough coins, or equipping a cosmetic that is not in the inventory. The quiz is graded on the server: the reward is `min(correctCount, 5)` coins, with a cooldown between plays (`MINIGAME_COOLDOWN_MS`, default 30 s) and a daily cap (`MINIGAME_MAX_PLAYS_PER_DAY`, default 10 per UTC day); both answer `429 RATE_LIMITED` and pay nothing.

```bash
curl -s -b cookies.txt -X PUT $API/api/pets/me/pancho -H "Content-Type: application/json" \
  -d '{"panchoId":"n02085620_10074","imgUrl":"https://images.dog.ceo/breeds/dachshund/n02085620_10074.jpg"}'
curl -s -b cookies.txt -X POST $API/api/pets/me/inventory -H "Content-Type: application/json" -d '{"cosmeticId":1}'
curl -s -b cookies.txt -X PUT $API/api/pets/me/equipped -H "Content-Type: application/json" -d '{"head":1,"face":null}'
curl -s -b cookies.txt $API/api/minigames/quiz
curl -s -b cookies.txt -X POST $API/api/minigames/quiz/submit -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":"q1","selectedIndex":1},{"questionId":"q2","selectedIndex":2},{"questionId":"q3","selectedIndex":1},{"questionId":"q4","selectedIndex":1},{"questionId":"q5","selectedIndex":3}]}'
```

> `POST /api/minigames/reward` (UN-303 stop-gap) **was removed** when UN-501 moved the grading to the server, and now answers `404`. `src/lib/gameApi.js` (`awardMinigameCoins`) still calls it, so the quiz reward from the UI must be migrated to the two routes above.

---

## ADR routes that are NOT implemented (H-04)

Proposed in `ADR-001-api-mongodb.md` section 7.3 but absent from `server/routes/*.js`. Do not call them.

| ADR route | What exists instead |
|---|---|
| `PATCH /api/me` | — (profile editing is not implemented) |
| `GET /api/pets/me` | `GET /api/me/game` (returns `dog`) |
| `GET /api/pets/:id` | — |
| `POST /api/classrooms/:id/periods` | — (the period is created with the classroom) |
| `POST /api/assignments/:id/submissions` | `POST /api/assignments/:id/submit` |
| `GET /api/assignments/:id/submissions` | — |
| `GET /api/quiz-questions` | `GET /api/minigames/quiz` |
| `POST /api/minigames/:id/plays` | `POST /api/minigames/quiz/submit` |