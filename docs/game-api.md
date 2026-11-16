# Game API (UN-301)

Base path: `/api`. All routes need the session cookie (ADR 5.2) and, except the catalog, are
**student only**: a teacher gets `403 FORBIDDEN`. Errors use `{ "error": { "code", "message" } }`.
Code: `server/routes/pets.js`, `server/routes/cosmetics.js`, `server/routes/me.js`,
`server/services/gameService.js`, `server/validators/game.js`, `server/config/game.js`.

## Endpoints

| Method | Path | Role | Success | Notes |
|---|---|---|---|---|
| GET | `/api/me/game` | student | 200 | `{ student, dog, currentAssignment }`, same shape as `useGameState()`. `404` if the student has no Pancho yet (no classroom joined). |
| GET | `/api/cosmetics` | any | 200 | `{ cosmetics: [{ id, name, category, cost, image }] }` read from the `cosmetics` collection. |
| PUT | `/api/pets/me/pancho` | student | 200 | Body `{ panchoId, imgUrl }`. `imgUrl` must be an `https://images.dog.ceo/` image. |
| POST | `/api/pets/me/inventory` | student | 201 | Body `{ cosmeticId }` (a number). Buys a cosmetic. |
| PUT | `/api/pets/me/equipped` | student | 200 | Body with one or more of `head`, `face`, `neck`, `body`: a `cosmeticId` equips, `null` unequips, omitted slots do not change. |

Every write returns the whole game state `{ student, dog, currentAssignment }`.

## Rules

- **Starting coins:** 270 (`server/config/game.js`), given when the student joins a classroom.
- **Buy:** the cosmetic must exist (`404`), must not be owned (`409 "You already own that cosmetic."`)
  and the student needs enough coins (`409 "Not enough coins."`). It is ONE atomic update whose
  filter holds those conditions, so parallel requests cannot spend the same coins twice and the
  balance never goes below 0. A failed purchase changes nothing.
- **Equip:** the cosmetic must exist (`404`), be owned (`409`) and match the slot: Head→`head`,
  Face→`face`, Neck→`neck`, Body→`body` (`400`, ADR 6.11). All slots are checked before writing,
  so one bad slot changes nothing.
- **Choose Pancho:** only stores `panchoId` and `imgUrl`. It never changes health, hunger or
  status (unlike the old client action): a new Pancho already starts at 100/100, and resetting
  here would be a hidden revive (ADR 5.3, 5.4).
- **`dog.status`** is `"ALIVE"`/`"DEAD"` in this response (client shape); the database and the
  ADR use lowercase. Decide in UN-303 whether the client adapts.
- **`currentAssignment`** is the active assignment of the classroom (ADR 5.3): first by `dueAt`
  that is still in the future and not submitted, once the period started. Otherwise the default
  task `assign_01`. `steps` are the 4 checklist steps, all `completed: false` until UN-302.
- **`hunger` / `health` / `status`** are reconciled with the server clock on every read and after
  every change (UN-108, `server/services/petStateService.js`); see "Hunger and health" below.
- A dead Pancho can still buy and equip (as in the client; ADR section 12 leaves it open).

## Verifying

```
npm test   # server/tests/game.test.js (18 cases) runs with the rest of the suite
```

## Hunger and health (UN-108, ADR 5.3 and 5.4)

Calculated lazily from timestamps: no `setInterval`, no cron (Vercel is serverless). It runs in
`GET /api/me/game`, after every buy / equip / choose, and in the teacher's student list.

- **Hunger** (0-100, not stored as truth): linear between the start of the active assignment's
  window and its `dueAt`. The window starts at the previous assignment's `dueAt` (or
  `period.startDate`). Active assignment = first by `dueAt` that is not submitted and still in the
  future, once the period started. With no active assignment: 0 if the last assignment of the
  period was missed, otherwise 100.
- **Health**: `clamp(100 - missed * 100 / totalAssignments + healthAdjustment, 0, 100)`, where
  `missed` = assignments with `dueAt <= now` and no submission, and `healthAdjustment` = points the
  teacher forgave (default 0, see "Restoring health"). The stored `health` is only a cache: it is
  derived on every read, so nothing the client or an old request writes can change it.
- **Status**: health 0 -> `dead`. A dead Pancho never changes again (no revive exists, ADR D5).
- Only health, hunger and status are written to MongoDB, with atomic guards (`status: "alive"` and
  the `healthAdjustment` that was read, in the filter), so a read cannot revive Pancho and a stale
  write cannot overwrite a restoration or a death.
- **Offline cap:** not needed. Because the state comes from deadlines, being away for days gives
  the same result as staying connected; the prototype's "-2 every 15 s" tick (which kills Pancho
  after ~15 minutes offline) is NOT used. The "interval by environment variable" of the ticket does
  not apply: for a demo, seed assignments with dates near now (UN-111).
- The server clock comes from `server/utils/clock.js`; tests replace `clock.now` to simulate days.

## Join code rate limit

`POST /api/classrooms/join` allows 20 attempts per student every 15 minutes (counter stored in
MongoDB, like login); the next one gets `429`. Join codes have 6 characters, so without this limit
they could be guessed by brute force.

## Students who join late (ADR Rev. 2.5)

Assignments already past due when a student joins the classroom count as missed for that student
(no exception for the join date). The new Pancho starts at 100/100 but the very first read already
applies those misses: with 5 assignments and 2 expired, health is 60; if all had expired it is born
`dead`. A teacher can forgive points while Pancho is alive (see below); a dead Pancho cannot be restored.

## Restoring health (teacher, UN-108, ADR Rev. 2.3)

`POST /api/classrooms/:id/students/:studentId/restore-health` with `{ "points": 20, "reason": "Medical excuse" }`
(`points` optional: omitted = give back everything that was lost; `reason` required, 3-200 chars).

- **It is not reviving** (D5 stays: UN-109 is discarded). It only works while Pancho is `alive`
  with `health > 0`; a dead Pancho gets `409` and stays dead until the next period. The check runs
  after reconciling with the clock, so a Pancho that died since the last read is not restorable.
- Health can never go above 100: `points` greater than the lost points -> `409`; health already 100 -> `409`.
- The points go to `pets.healthAdjustment` (added in the formula above), so the automatic
  recalculation does not overwrite them and later missed assignments still subtract their share.
  Example (5 assignments, 20 each): 2 missed -> 60; restore 20 -> 80; a 3rd missed -> 60.
- Each restoration is logged in `pets.healthRestoreLog` (teacher, time, points, before/after, reason;
  last 50). A new period resets `healthAdjustment` to 0.
- Permissions: only the teacher who owns the classroom (`403` otherwise; student of another
  classroom -> `404`). Two simultaneous requests cannot stack on the same state (one gets `409`).

## Steps and submission (UN-302, after the UN-108 audit)

- All game endpoints answer the same state (`gameService.toGameJson`), reconciled with the clock,
  and `GET /api/me/game` now shows the completed steps too.
- Step progress belongs to ONE assignment (`pets.currentAssignmentStepsFor`). When the active
  assignment changes (the previous one expired or was submitted) the progress starts from zero.
- Completing a step is one atomic update: the same step sent twice, or at the same time, is saved
  once (`409` for the others). A dead Pancho (also one that died by time since the last request)
  gets `409`.
- Submitting sets hunger to 100 (ADR 5.5) and clears the steps. `rewards.hunger` is the hunger
  actually recovered (`100 - hunger before`, rounded), not a fixed +30.

## Minigame reward limits (UN-303 stop-gap)

`POST /api/minigames/reward` still trusts the `correctCount` the client sends (UN-501 will grade the
quiz on the server), so it is limited: at most 5 coins per play, one claim every 30 s (claimed
atomically with the payment, so parallel requests do not stack) and 10 plays per UTC day. Beyond
that: `429 RATE_LIMITED` and nothing is paid. Each play is saved in `minigame_plays`. Values can be
changed with `MINIGAME_COOLDOWN_MS` and `MINIGAME_MAX_PLAYS_PER_DAY` (ADR decision 6 is still open).
