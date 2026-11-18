# Raise a Pancho — Project Technical Documentation

> **Document status:** generated from a real review of the repository code. Phase 1 (frontend) and the first part of Phase 2 (Express API, MongoDB models, authentication with sessions, classrooms, security middleware) **are implemented and verified against the code**. Assignments, the server-side game state (Pancho, shop, minigame reward) and the lazy hunger/health rules are also implemented (see `docs/api.md`). The quiz is now graded on the server (UN-501). What remains is the production verification on Vercel, finishing the teacher panel in the UI (classroom creation and settings exist; the student list and the restore-health button do not) and moving the client's quiz reward to the new quiz endpoints. Every section must be updated when its code changes.

---

## 1. Project Title and General Description

**Raise a Pancho** is an interactive educational web platform in which each student adopts and takes care of a virtual pet (a "Pancho", a dachshund) that evolves as the student completes academic tasks assigned by their teacher. Taking care of the Pancho (feeding it, dressing it with cosmetics, keeping its stats up) works as a gamification layer on top of academic tracking: completing assignments awards coins and rewards that the student uses to maintain and customize their pet.

The project is designed around two user roles:

- **Student:** adopts a Pancho, completes assignments, earns coins, buys and equips cosmetics, and checks their own statistics.
- **Teacher:** creates and manages assignments, registers/manages students, and supervises the progress of the course.

> **Status note:** the **Teacher** role and the backend exist: `server/` provides registration, login, logout, current user and classroom endpoints on MongoDB. The game state of the Student (hunger, health, coins, cosmetics) is stored and calculated on the server (`GET /api/me/game`, `/api/pets/me/*`, `/api/assignments/:id/steps|submit`). Section 3 details what exists and what is missing for each role.

---

## 2. Architecture and Requirements History (Phase 1 and Phase 2)

### 2.1 Phase 1 — Frontend (✅ Implemented)

Phase 1 built the complete frontend in React, with all data persisted locally in the browser (no backend). This is what the repository contains today:

| Requirement | Status | Evidence in the code |
|---|---|---|
| Well-structured components, none longer than 80 lines | ✅ Met | Every `.jsx` file in `src/` is under 80 lines. Large pages (e.g. `Shop`, `RaisePancho`, `CosmeticDetail`) are split into single-responsibility subcomponents inside subfolders (`pages/shop/`, `pages/raise/`, `pages/home/`, etc.). |
| At least 3 routes, with at least 1 dynamic route (`useParams`) | ✅ Met | See the route table in 2.1.1. There are more than 10 public/private routes, and 2 dynamic routes: `/stats/:username` and `/Shop/:cosmeticId`. |
| Protected routes that redirect unauthenticated users | ✅ Met | `src/components/ProtectedRoute.jsx` protects `/raise`, `/stats`, `/shop`, `/Shop/:cosmeticId` and `/minigames`, redirecting to `/login` when there is no session. `/teachersPark` additionally requires the `teacher` role (`src/routes/withRole.js`). |
| At least one custom Hook of our own | ✅ Met (15 hooks) | `src/lib/use*.js`, `src/hooks/use*.js` and per-page hooks (`useChooseForm`, `useJoinForm`, etc.). See details in 2.1.2. |


**Phase 1 stack:**

- **React 18** + **React Router DOM 6** (client-side routing, `BrowserRouter`).
- **Vite 5** as bundler/dev server.
- **Tailwind CSS 3** for styling.
- **Game state:** a custom `Context` (`src/state/GameStateContext.jsx` + `src/state/gameState.js`) that centralizes the student's and the Pancho's state (hunger, happiness, coins, equipped cosmetics, active assignment), with pure actions separated by domain in `src/state/actions/` (`pancho.js`, `shop.js`, `assignment.js`, `lifecycle.js`).
- **Persistence:** the game state still lives in `localStorage`, through `src/state/storage.js` and `src/lib/dogStorage.js`. Accounts, sessions and classrooms go through our own API (`src/lib/api.js`, base `/api`), plus the public API `https://dog.ceo/api/...` for the Pancho images (see `src/lib/dogApi.js`).
- **Authentication:** `AccessProvider` (`src/lib/AccessContext.jsx`, mounted in `main.jsx`) loads the session from `GET /api/me` and exposes `status`, `user`, `role`, `login`, `register` and `logout` through `useAccess()`; `useRole()` returns the role. The session is an httpOnly cookie (`session`) issued by the server, so the client never handles the token. Any `401` outside login/register closes the client session (`auth:expired` event). `src/lib/auth.js` is kept only for backwards compatibility.

#### 2.1.1 Route table (`src/routes/routesConfig.jsx`, rendered by `src/App.jsx`)

| Route(s) | Page | Type | Protected |
|---|---|---|---|
| `/` | `Home` | Public | No |
| `/login` | `Login` | Public | No |
| `/aboutus`, `/aboutus.html` | `AboutUs` | Public | No |
| `/choose`, `/choosePancho`, `/choosePancho.html` | `ChoosePancho` | Public | No |
| `/raise`, `/raisePancho`, `/raisePancho.html` | `RaisePancho` | Private | **Yes** (session) |
| `/stats/:username`, `/stats`, `/panchoStats`, `/panchoStats.html` | `PanchoStats` | Private, **dynamic** (`useParams`) | **Yes** (session) |
| `/shop`, `/Shop`, `/Shop.html` | `Shop` | Private | **Yes** (session) |
| `/Shop/:cosmeticId` | `CosmeticDetail` | Private, **dynamic** (`useParams`) | **Yes** (session) |
| `/minigames`, `/MiniGames`, `/MiniGames.html` | `MiniGames` | Private | **Yes** (session) |
| `/teachersPark`, `/teachersPark.html` | `TeachersPark` | Private, teacher only | **Yes** (session + `teacher` role, via `withRole`) |
| `/dogpark`, `/dogPark.html` | — | Redirect to `/teachersPark` | — |

Private routes are wrapped in `<ProtectedRoute>`, which reads `useAccess()` (`checking` / `authenticated` / `anonymous`): while it is checking it renders nothing; if there is no session it redirects to `/login`, saving the origin route in `state.from`. `/teachersPark` uses `withRole(["teacher"])` (`src/routes/withRole.js`), which additionally requires the role.

> The session comes from the server (`GET /api/me`), and the role is read from the database on every request, never from the client. `/teachersPark` is guarded in the client by `withRole(["teacher"])` and the API enforces the role with `authorize`.

**Removed (UN-202):** `dogParkAuth.js`, `useDogParkAccess.js`, `useDogParkLogin.js` and the `pages/dogpark/` folder (`DogParkLogin`, `DogParkField`, `DogParkPlaceholder`). `DogParkPlaceholder` is no longer listed. Teacher folder: `src/pages/teacherspark/` (`TeachersPark`, `TeachersParkNav`, `TeachersParkNavItem`, `ParkDog`, `navItems.js`, `parkDogs.js`; the latter with hard-coded data that UN-403 will replace).

#### 2.1.2 Reference Custom Hook (dependencies and cleanup)

As a representative example for the oral defense, `src/lib/useDogImages.js` encapsulates the loading of the available Pancho images:

- **What it solves:** it separates from `ChoosePancho` the logic of requesting the Pancho image from `dog.ceo`, with loading, error, offline and cache handling. The page only consumes `{ images, loading, error, offline, fromCache, reload }`.
- **Dependency array:** `[reloadToken, reload, isOnline]`. The effect runs on mount and runs again only if `reloadToken` changes (incremented by `reload()`, for example when the connection comes back) or `isOnline` changes. `reload` is stable (`useCallback` with no dependencies), so it does not trigger the effect by itself.
- **Cleanup:** the effect creates an `AbortController` and an `active` flag. On unmount, or before the next run, the cleanup sets `active = false` and calls `controller.abort()`. The request is cancelled and a late response does not update the state: the `AbortError` is ignored and every `setState` is guarded by `active`.
- **Offline:** if `isOnline` is false, the effect ends without requesting anything (`loading = false`). `useOnlineStatus` registers the `online` and `offline` listeners on `window` and removes them in its own cleanup; when the connection returns it calls `reload`.
- **Other details:** it waits a minimum of 600 ms (`MIN_LOADING_MS`) to avoid flickering; if `dog.ceo` fails it uses the `localStorage` cache (`dogCache.js`) and sets `fromCache`; if there is nothing, it shows the error and the static image.

**`usePolling`** (`src/lib/usePolling.js`) periodically refreshes the server state in `RaisePancho` and `PanchoStats`, because hunger and health are derived on the server clock. It has two effects with their own cleanup: the timer effect (`[doFetch, intervalMs, enabled]`, cleanup `clearInterval`) and the focus effect (`[doFetch, enabled]`, cleanup removes the `visibilitychange` and `focus` listeners); `doFetch` is stable (`useCallback` with `[]`) and reads the latest `fetchFn` through a ref, with a mutex so two fetches never overlap. This matches the code and [`docs/usePolling.md`](docs/usePolling.md). **`useMyClassroom`** loads the current user's classroom through `GET /api/classrooms/me`.

Other custom hooks (17 in use in total, counting `useDogImages`, `usePolling` and `useMyClassroom`): `useAccess`, `useRole`, `useChangeFlash`, `useDarkMode`, `useFavorites`, `useFeedback`, `useStatus`, `useNavbarVisibility`, `useOnlineStatus`, `useChooseForm`, `useConfirmPancho`, `useBenefitsSearch`, `useJoinForm` and `useQuiz`. `usePageStyles.js` is still in `pages/about/`, but no component uses it (orphan).

#### 2.1.3 Mini Games (gameplay, still Phase 1 / frontend only)

`/minigames` is no longer a placeholder: it includes a short academic trivia quiz (`src/pages/minigames/`) as the first working example. Students earn coins for playing, separately from the academic flow of `RaisePancho` (which only restores Hunger, never coins — see `SUBMIT_REWARDS` in `state/constants.js`).

- **`src/pages/minigames/useQuiz.js`:** custom hook that manages the state of a round (current question, selected answer, correct answers, whether it has finished). It needs no cleanup: it opens no timers or listeners, it only reacts to the player's clicks.
- **`src/state/actions/minigames.js` → `awardMinigameCoins`:** follows the same pattern as the rest of `state/actions/` (receives the state, returns a new state without mutating). It awards 1 coin per correct answer, up to the cap `MINIGAME_REWARD_COINS = 5` defined in `state/constants.js` (the same value the `AboutUs` FAQ already documented: "+5 coins" per completed mini game). Coins are only awarded when the student explicitly presses "Claim coins", never automatically.
- Coins are now granted by the server, which grades the quiz itself (UN-501): `GET /api/minigames/quiz` returns the 5 questions without `correctIndex` and `POST /api/minigames/quiz/submit` pays `min(correct answers, 5)` coins (30 s cooldown, 10 plays per day). The old `POST /api/minigames/reward` was removed, but `src/lib/gameApi.js` (`awardMinigameCoins`) still calls it, so the UI reward must be migrated.

### 2.2 Phase 2 — Backend, Security and Full Stack Deployment (🟡 In progress)

> The API in `server/` (Express 5 + Mongoose) is implemented for authentication, the current user and classrooms. Assignments, submissions, Pancho gameplay endpoints and the seed script are still pending or recently added; this section is updated as each one is verified.

**Phase 2 goal:** replace `localStorage` and the client's access flag with a real backend with database persistence and server-verified authentication, without removing or breaking the Phase 1 frontend.

| Requirement | Status | Current state / what is left |
|---|---|---|
| Full CRUD against MongoDB Atlas (no in-memory data) | 🟡 In progress | Models `User`, `Classroom`, `Assignment`, `Pet`, `Submission`, `MinigamePlay`, `Cosmetic`, `QuizQuestion`; endpoints for auth, `/api/me` and classrooms. Pending: assignment, submission and Pancho endpoints. |
| JWT with `Student` and `Teacher` roles, validated in the backend | 🟡 In progress | JWT (HS256, 1 hour) in an httpOnly cookie; `authenticate` loads the user and its role from the database; `authorize(...roles)` blocks on the server. Pending: apply it to the endpoints that are still missing. |
| Full stack deployment on Vercel (frontend + API) | 🟡 In progress | One Vercel project serves the frontend and the API (`api/index.js`, `vercel.json`). Pending: environment variables, production verification and the delivery URL. |
| Security: XSS, NoSQL injection, `helmet` | 🟡 In progress | Done: `helmet`, NoSQL sanitization, strict `zod` validation, rate limiting on login/register, CORS restricted to the same origin and configured origins, `passwordHash` never serialized. Pending: review escaping of free text (Pancho name, answers) and a stronger password rule. |

#### 2.2.1 Proposed target architecture

```
Frontend (React + Vite)          Backend (Node.js + Express)        Database
┌───────────────────────┐        ┌────────────────────────┐        ┌──────────────┐
│ GameStateContext       │  JWT   │ /api/auth/*            │        │ MongoDB Atlas │
│ (today: localStorage)  │ <----> │ /api/students/*        │ <----> │ - students    │
│ (future: fetch to API) │ Bearer │ /api/teachers/*         │        │ - teachers    │
│ ProtectedRoute         │ token  │ /api/assignments/*      │        │ - assignments │
│ (today: local useAccess)│       │ /api/panchos/*          │        │ - panchos     │
└───────────────────────┘        │ middlewares: helmet,    │        └──────────────┘
                                  │ cors, sanitize, auth,   │
                                  │ authorize(role)         │
                                  └────────────────────────┘
```

This migration implies, in the frontend, gradually replacing:
- `src/lib/auth.js` / `useAccess.js` → real login/registration calls against `/api/auth/login`, storing the JWT (ideally in memory + refresh, or in an `httpOnly cookie` issued by the backend instead of `localStorage`, to reduce the XSS surface).
- `src/state/storage.js` / `dogStorage.js` → `fetch`/`axios` requests to the backend to read and write the state of the Pancho and the student.

---

## 3. Role and Permission Structure (Student vs. Teacher)

### 3.1 Current state (Phase 1)

Both roles exist in the system. Students register from the Home form and teachers register with the `TEACHER_CODE` through the API. The server stores the role and enforces it; the client shows `/teachersPark` only to teachers. The student's game state is still local until the Pancho endpoints are connected.

### 3.2 Target permission design (Phase 2, to be implemented)

| Action | Student | Teacher |
|---|---|---|
| Register / log in | ✅ | ✅ |
| Adopt and customize their own Pancho | ✅ | ❌ (not applicable) |
| View their own statistics (own `/stats/:username`) | ✅ | — |
| View statistics of **any** student in the course | ❌ | ✅ |
| Complete/submit their own assignments | ✅ | ❌ |
| Create, edit or delete assignments | ❌ | ✅ |
| Register or remove students | ❌ | ✅ |
| View the aggregated progress of the course | ❌ | ✅ |

**Mandatory design principle:** the UI may hide buttons depending on the role, but that is purely cosmetic. Every backend endpoint that modifies or exposes sensitive data **must** validate on the server, based on the role contained in the verified JWT (not on a value sent by the client), that the authenticated user has permission for that action. A student who calls `POST /api/assignments` directly with their own valid token must receive `403 Forbidden`, even if they never went through the teacher UI.

---

## 4. API Endpoints and Security (CRUD, JWT, Helmet, Sanitization)

> Every endpoint in sections 4.1 and 4.2 exists in `server/routes/*.js`. The complete reference (roles, request/response JSON, error format and `curl` examples) is [`docs/api.md`](docs/api.md); see also [`docs/classrooms-api.md`](docs/classrooms-api.md), [`docs/game-api.md`](docs/game-api.md) and [`docs/ADR-001-api-mongodb.md`](docs/ADR-001-api-mongodb.md). Routes proposed by the ADR that do not exist are listed in 4.3.

### 4.1 Authentication

| Method | Route | Required role | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Body `{ name, email, password, role, teacherCode? }` (strict `zod`, password 6–128 characters). Hashes with `bcrypt`, starts the session cookie and returns `201 { user }`. `403` if the teacher code is wrong, `409` if the email exists. Rate limited. |
| `POST` | `/api/auth/login` | Public | Body `{ email, password }`. Returns `{ user }` and sets the session cookie, or `401` "Credenciales inválidas". Rate limited (`429`). |
| `POST` | `/api/auth/logout` | Public | Clears the session cookie and returns `204`. |
| `GET` | `/api/me` | Authenticated | Returns the current user, with the role read from the database. |


### 4.2 Implemented endpoints (summary)

| Area | Routes | Role |
|---|---|---|
| Health | `GET /api/health` | Public |
| Current user | `GET /api/me`; `GET /api/me/game` (`{ student, dog, currentAssignment }`, reconciles hunger/health) | Authenticated; the second one Student only |
| Classrooms | `POST /api/classrooms`, `PATCH /api/classrooms/:id`, `DELETE /api/classrooms/:id`, `GET /api/classrooms/:id/students`, `DELETE /api/classrooms/:id/students/:studentId` | Teacher (owner) |
| Classrooms | `GET /api/classrooms/me` | Authenticated |
| Classrooms | `POST /api/classrooms/join` (rate limited; creates the Pancho with 270 coins) | Student |
| Restore health | `POST /api/classrooms/:id/students/:studentId/restore-health`: forgives lost health of a **living** Pancho (stored in `pets.healthAdjustment`, logged in `healthRestoreLog`, capped at 100); `409` if the Pancho is `dead`. | Teacher (owner) |
| Assignments | `GET /api/assignments`, `GET /api/assignments/:id` | Student, Teacher |
| Assignments | `POST /api/assignments`, `PATCH /api/assignments/:id`, `DELETE /api/assignments/:id` (only before the period starts, else `409 PERIOD_LOCKED`) | Teacher |
| Assignments | `POST /api/assignments/:id/steps` (steps 1-3), `POST /api/assignments/:id/submit` (hunger back to 100) | Student |
| Game | `GET /api/cosmetics` | Authenticated |
| Game | `PUT /api/pets/me/pancho`, `POST /api/pets/me/inventory`, `PUT /api/pets/me/equipped` | Student |
| Minigames | `GET /api/minigames/quiz`, `POST /api/minigames/quiz/submit` (graded on the server; `POST /api/minigames/reward` no longer exists) | Student |

**There is no "revive" endpoint:** UN-109 was dropped (ADR D5). A dead Pancho is immutable; teachers can only restore health of a living one. **GitHub Pages was discarded** as a deployment target (ADR 10, Rev. 2): the `SameSite=Lax` session cookie does not travel between domains, so the front end and the API are served by one Vercel project.

### 4.3 ADR routes not implemented (🔲 Planned)

| ADR route | Status |
|---|---|
| `PATCH /api/me`, `GET /api/pets/me`, `GET /api/pets/:id` | 🔲 (`GET /api/me/game` returns the Pancho) |
| `POST /api/classrooms/:id/periods` | 🔲 |
| `POST` / `GET /api/assignments/:id/submissions` | 🔲 (`POST /api/assignments/:id/submit` exists instead) |
| `GET /api/quiz-questions`, `POST /api/minigames/:id/plays` | 🔲 (UN-501 exposes `GET /api/minigames/quiz` and `POST /api/minigames/quiz/submit` instead) |

### 4.4 Cross-cutting security

| Control | Status | Where |
|---|---|---|
| `helmet` on every `/api` response | ✅ | `server/app.js` (tests: `server/tests/security.test.js`) |
| NoSQL sanitization + strict `zod` schemas | ✅ | `server/middleware/security.js`, `server/validators/` |
| JWT in an `httpOnly` cookie, role read from the database | ✅ | `server/middleware/authenticate.js` |
| Origin policy (`403` for foreign origins) | ✅ | `server/config/cors.js` |
| Rate limit on login, register and join | ✅ | `server/middleware/authRateLimit.js` (tests: `rateLimit.test.js`) |
| Security headers for the static front end | 🟡 | `vercel.json` `headers` (CSP written from the hosts the code uses; check the browser console after deploying) |
| XSS: free text rendered as text, no `dangerouslySetInnerHTML` | 🟡 | Re-audited in UN-601 |

---

## 5. Local Execution and Deployment Instructions

### 5.1 Frontend (Phase 1 — current today)

**Requirements:** Node.js 18+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (http://localhost:5173)
npm run dev

# 3. Generate the production build (dist/ folder)
npm run build

# 4. Preview that build locally
npm run preview
```

**Deployment (Vercel):** a single project serves the frontend and the API from the repository root (Framework Preset: Vite, build `npm run build`, output `dist`). See section 5.2. There is no `deploy` script and GitHub Pages is no longer used.


### 5.2 Backend and Full Stack deployment on Vercel

```bash
npm install
cp .env.example .env
npm run dev:server
npm run dev
```

The API listens on `http://localhost:3000`; Vite proxies `/api` to it.

| Script | Purpose |
|---|---|
| `npm test` | Server suite (`node:test` + `supertest` + in-memory MongoDB, serial). |
| `SEED_PASSWORD=<value> npm run seed -- --yes` | Recreates demo data; prints the target `host/db`; refuses to run in production or without `--yes`/`SEED_PASSWORD` (default only for a local MongoDB). |
| `npm run db:check` | Verifies the connection to Atlas. |
| `npm run db:indexes` | Creates indexes; mandatory once on Atlas because `autoIndex` is off on Vercel. |

Environment variables (do not commit `.env`):

| Variable | Description |
|---|---|
| `MONGODB_URI` | Connection string to MongoDB Atlas. |
| `JWT_SECRET` | Secret to sign/verify tokens. Required: without it login and register fail with `500`. |
| `TEACHER_CODE` | Code a teacher must enter to register. |
| `PORT` | Local API port (`3000`). |
| `ALLOWED_ORIGINS` | Optional extra allowed origins; normally empty because frontend and API share a domain. |
| `MINIGAME_COOLDOWN_MS` | Optional. Minimum time between minigame plays (default in `server/config/game.js`). |
| `MINIGAME_MAX_PLAYS_PER_DAY` | Optional. Daily minigame play limit (default in `server/config/game.js`). |
| `SEED_PASSWORD` | Seed script only. Password of the demo accounts. |

Vercel: leave Root Directory empty, load the variables in the dashboard (never in the repo), and allow `0.0.0.0/0` in Atlas Network Access. Do not define `VITE_API_URL` (the client uses the same-origin `/api`) and turn off Vercel Authentication for Production. `vercel.json` also sends `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and a CSP for the static files (allowing `https://images.dog.ceo` images, the `https://dog.ceo` API and the Google Fonts used by `src/index.css`). Delivery URL: pending.

---

## 6. Document Update Policy (mandatory)

This file is a **living document**, not a snapshot taken only once. Its value depends on it continuing to reflect the real state of the code at all times, so the following rule applies without exception:

> **Every modification to the project (code, configuration or deployment) must be accompanied by an update to this `.md` in the same commit or pull request.** A change is not considered finished until the document is up to date.

So that tracking is automatic and anyone (including the teacher, in the oral defense) can see at a glance what has advanced and what is missing, every change must:

1. **Update the status of the affected requirement** in the tables of sections 2.1 and 2.2, always using one of these three markers:
   - ✅ **Done** — implemented, tested and verified against the real code (not against the intention).
   - 🟡 **In progress** — construction started, but it does not yet meet the full requirement (for example, the endpoint exists but does not validate the role, or the JWT is issued but not verified in the middleware).
   - 🔲 **Planned** — there is no code for it yet.
   
   Never leave an item marked ✅ if the code does not back it up: it is preferable to mark it 🟡 and explain what is missing than to declare something finished ahead of time.

2. **Add an entry to the Log (section 7)** for every relevant change in architecture, endpoints, roles/permissions, security or deployment, using the table format: date, author, change and status reached (🔲→🟡, 🟡→✅, etc.).

3. **Move the real detail** from section 2.2 (plan) to where it belongs once implemented: if an endpoint goes from planned to done, its row stops being "to implement" and starts documenting the real route, role and behavior (including error cases), just as was already done with the Phase 1 routes in section 2.1.1.

4. **Review the "not implemented yet" warnings** (such as the one in section 4) and remove them as soon as the first real endpoint exists, replacing them with the documentation of the concrete endpoint.

The goal is that, by reading only this file, it is possible to know at any time which parts of the project are real today and which are still plan, without having to read the code to confirm it.

---

## 7. Future Maintenance Log

> Add one entry for every relevant change in architecture, deployment or security, following the policy in section 6. Suggested format: date, author, summary, impact and status.

| Date | Author | Change | Impact | Status |
|---|---|---|---|---|
| 2026-11-17 | Nicolás (assisted) | UN-110/UN-602: `.env.example` lists `MINIGAME_COOLDOWN_MS` and `MINIGAME_MAX_PLAYS_PER_DAY` and no longer mentions GitHub Pages; `vercel.json` sends `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and a CSP (`img-src` allows `https://images.dog.ceo`, `connect-src` allows `https://dog.ceo`, and Google Fonts are allowed because `src/index.css` imports Playfair Display) for static files; `src/lib/asset.js` comment updated. UN-111: `server/scripts/seed.js` derives live pet health/hunger from assignments and submissions (Ana 100/30, Bruno 80/30, Carla 60/30, Elena 100/100, Diego dead 0/0), gives every pet a valid `panchoId` and `imgUrl`, requires `--yes` and `SEED_PASSWORD` (default only for local MongoDB), prints the target `host/db` and aborts in production. UN-603: new `server/tests/security.test.js`, `rateLimit.test.js` and `classrooms.test.js` (written, **not yet executed**: the baseline and final `npm test` results are still to be recorded). UN-703: `<main>` in `Login`, `AboutUs`, `ChoosePancho` and `MiniGames` (plus a `<footer>` in `AboutUs`). UN-601 (S-03): `rel="noopener noreferrer"` in `ContactSection`. UN-604/UN-605: new `docs/api.md` (real endpoints, ADR routes not implemented), `GET /api/classrooms/me` fixed in `docs/classrooms-api.md`, new README. UN-003: removed `npm run deploy` and the GitHub Pages target, replaced the target-contract sections 4.2-4.4 with the real endpoints, documented `usePolling` (checked against `src/lib/usePolling.js`), `useMyClassroom`, `restore-health` and the UN-501 quiz routes, noted that revive does not exist, and corrected the date of the previous UN-003 entry. | Documentation matches the repository code (UN-501 included). Open finding: `src/lib/gameApi.js` still calls the removed `POST /api/minigames/reward`, and `server/tests/stepsMinigames.test.js` still tests it. | 🟡 In progress (tests pending execution, live Atlas/Vercel verification pending) |
| 2026-11-15 | Claude (assisted) | ADR Rev. 2.3 and 2.4 accepted by Karol and Isaac; Rev. 2.5 decided: students who join after the period started are charged for assignments already past due (documented in ADR 5.3 and covered by a test). 112 tests pass. | Rule is now explicit instead of pending. | ✅ Done |
| 2026-11-15 | Claude (assisted) | UN-108 rebased on UN-302/303/305 plus audit fixes: dead Pancho could still complete steps (status case bug), duplicated game-state builders, step progress leaking between assignments, non-atomic step writes, submit hunger now 100 (ADR 5.5), and `/api/minigames/reward` limited (5 coins/play, 30 s cooldown, 10 plays/day) because it allowed unlimited coins. 111 tests pass. | Server state is consistent across all game endpoints. | ✅ Done |
| 2026-11-15 | Claude (assisted) | UN-108 (scope update): teachers can restore lost health of a living Pancho (`POST /api/classrooms/:id/students/:studentId/restore-health`, stored in `pets.healthAdjustment` and added by the reconciliation); dead Pancho is never restored; ADR Rev. 2.3. UN-108: lazy hunger/health on the server following ADR 5.3 (`server/services/petStateService.js`), applied in `GET /api/me/game`, after every game change and in the teacher's student list; dead Panchos never change. Audit fix: `POST /api/classrooms/join` is rate limited per student (join codes could be brute-forced). 69 tests pass. | Hunger and health now reflect the server clock; no timers or cron. | ✅ Done |
| 2026-11-14 | Claude (assisted) | UN-107 and UN-301: assignments API (`GET/POST /api/assignments`, `GET/PATCH/DELETE /api/assignments/:id`) in `server/routes/assignments.js`, `server/services/assignmentService.js` and `server/validators/assignment.js`; create/edit/delete only before the period starts (`PERIOD_LOCKED` after). ADR-001 revision 2 marked as approved by the four members; UN-109 (revive endpoint) dropped, consistent with ADR D5; `docs/classrooms-api.md` now describes authentication as functional (UN-103/104/105). | Server now exposes assignment CRUD for teachers and read access for enrolled students. UN-301 adds the server-side game state (`GET /api/me/game`, `GET /api/cosmetics`, `PUT /api/pets/me/pancho`, `POST /api/pets/me/inventory`, `PUT /api/pets/me/equipped`; see `docs/game-api.md`). Audit fixes: login no longer leaks which emails exist by timing, teacher code compared in constant time, the test-only rate-limit bypass is ignored on Vercel, and Mongoose validation errors answer 400 instead of 500. 52 integration tests pass. | ✅ Done |
| 2026-11-16 | Nicolás (assisted) | UN-003: route table aligned with `routesConfig.jsx` (`teacher` role on `/teachersPark`, `/dogpark` as a redirect); removal of `dogParkAuth.js`, `useDogParkAccess.js` and `pages/dogpark/` (incl. `DogParkPlaceholder`) documented; authentication section and hook list updated; `useDogImages` explanation completed (dependencies, cleanup, abort and listeners). | Documentation matches `origin/main`. The session stays 🟡 until UN-104 exists. | ✅ Done |
| 2026-10-05 | Claude (assisted) | Style unification toward Tailwind CSS: the flat CSS injected in `AboutUs` was removed (`about/styles/*.js`, `usePageStyles.js`) and `AboutNav/Hero/Team/Project/FaqSection` were rewritten in pure Tailwind; `PanchoStatusBanner` moved its hex colors and `@keyframes` to `tailwind.config.js`. | Section 2.1.2 updated (the `usePageStyles` hook no longer exists). No visual or functional change for the user. | ✅ Done |
| 2026-10-05 | Claude (assisted) | Repository cleanup: `_bmad/` and the stray file `"tash push -m..."` (both tracked in git) were removed. A deployment bug from a previous session was also fixed: the backgrounds of `RaisePancho` and `PanchoStats` used absolute paths (`bg-[url('/images/...')]`) that broke under the GitHub Pages subdirectory. | Repository without tool files foreign to the project. The backgrounds of those two pages now do load on the published site. | ✅ Done |
| 2026-10-05 | Claude (assisted) | Re-render optimization and dependency cleanup: `GameStateContext` memoizes the context value (`useMemo`) instead of rebuilding it on every render; the 8 `useEffect`s that had `eslint-disable react-hooks/exhaustive-deps` were fixed, adding the real dependencies where it was safe to do so. | Fewer unnecessary re-renders in all consumers of `useGameState()`. Code without silenced lint warnings. | ✅ Done |
| 2026-10-05 | Claude (assisted) | New Mini Games section: working quiz (`src/pages/minigames/`) integrated into the already existing `/minigames` route, with a new `awardMinigameCoins` action in `state/actions/minigames.js` that awards coins (up to the cap already documented in the FAQ: +5 per mini game). | Section 2.1.3 (new) documents the flow. Still 100% frontend/`localStorage` (Phase 1); it does not touch anything from Phase 2. | ✅ Done |
| | | | | |