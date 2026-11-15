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
- **`hunger` / `health`** are the stored snapshot until UN-108 (lazy calculation).
- A dead Pancho can still buy and equip (as in the client; ADR section 12 leaves it open).

## Verifying

```
npm test   # server/tests/game.test.js (18 cases) runs with the rest of the suite
```
