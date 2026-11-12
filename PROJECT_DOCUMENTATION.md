# Raise a Pancho — Project Technical Documentation

> **Document status:** generated from a real review of the repository code. Phase 1 (frontend) and the first part of Phase 2 (Express API, MongoDB models, authentication with sessions, classrooms, security middleware) **are implemented and verified against the code**. The rest of Phase 2 (assignments, submissions, Pancho gameplay endpoints, production verification on Vercel) is documented as **target architecture / work plan**. Every section must be updated when its code changes.

---

## 1. Project Title and General Description

**Raise a Pancho** is an interactive educational web platform in which each student adopts and takes care of a virtual pet (a "Pancho", a dachshund) that evolves as the student completes academic tasks assigned by their teacher. Taking care of the Pancho (feeding it, dressing it with cosmetics, keeping its stats up) works as a gamification layer on top of academic tracking: completing assignments awards coins and rewards that the student uses to maintain and customize their pet.

The project is designed around two user roles:

- **Student:** adopts a Pancho, completes assignments, earns coins, buys and equips cosmetics, and checks their own statistics.
- **Teacher:** creates and manages assignments, registers/manages students, and supervises the progress of the course.

> **Status note:** the **Teacher** role and the backend exist: `server/` provides registration, login, logout, current user and classroom endpoints on MongoDB. The game state of the Student (hunger, coins, cosmetics, quiz) is still simulated in the frontend with `localStorage` until the Pancho endpoints are connected. Section 3 details what exists and what is missing for each role.

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

Other custom hooks (15 in use in total, counting `useDogImages`): `useAccess`, `useRole`, `useChangeFlash`, `useDarkMode`, `useFavorites`, `useFeedback`, `useStatus`, `useNavbarVisibility`, `useOnlineStatus`, `useChooseForm`, `useConfirmPancho`, `useBenefitsSearch`, `useJoinForm` and `useQuiz`. `usePageStyles.js` is still in `pages/about/`, but no component uses it (orphan).

#### 2.1.3 Mini Games (gameplay, still Phase 1 / frontend only)

`/minigames` is no longer a placeholder: it includes a short academic trivia quiz (`src/pages/minigames/`) as the first working example. Students earn coins for playing, separately from the academic flow of `RaisePancho` (which only restores Hunger, never coins — see `SUBMIT_REWARDS` in `state/constants.js`).

- **`src/pages/minigames/useQuiz.js`:** custom hook that manages the state of a round (current question, selected answer, correct answers, whether it has finished). It needs no cleanup: it opens no timers or listeners, it only reacts to the player's clicks.
- **`src/state/actions/minigames.js` → `awardMinigameCoins`:** follows the same pattern as the rest of `state/actions/` (receives the state, returns a new state without mutating). It awards 1 coin per correct answer, up to the cap `MINIGAME_REWARD_COINS = 5` defined in `state/constants.js` (the same value the `AboutUs` FAQ already documented: "+5 coins" per completed mini game). Coins are only awarded when the student explicitly presses "Claim coins", never automatically.
- It remains 100% `localStorage` (Phase 1): it does not depend on anything from Phase 2.

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

> The endpoints in 4.1 are implemented. The classroom and `/api/me` endpoints are documented in `docs/classrooms-api.md`. Sections 4.2 and 4.3 remain the target contract and are not implemented yet.

### 4.1 Authentication

| Method | Route | Required role | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Body `{ name, email, password, role, teacherCode? }` (strict `zod`, password 6–128 characters). Hashes with `bcrypt`, starts the session cookie and returns `201 { user }`. `403` if the teacher code is wrong, `409` if the email exists. Rate limited. |
| `POST` | `/api/auth/login` | Public | Body `{ email, password }`. Returns `{ user }` and sets the session cookie, or `401` "Credenciales inválidas". Rate limited (`429`). |
| `POST` | `/api/auth/logout` | Public | Clears the session cookie and returns `204`. |
| `GET` | `/api/me` | Authenticated | Returns the current user, with the role read from the database. |


### 4.2 Students

| Method | Route | Required role | Description |
|---|---|---|---|
| `GET` | `/api/students/me` | Student | Profile and state of their own Pancho. |
| `PATCH` | `/api/students/me` | Student | Updates their own data (e.g. equipped cosmetics). |
| `GET` | `/api/students` | Teacher | List of the course's students. |
| `GET` | `/api/students/:id` | Teacher | Detail/statistics of a specific student. |
| `DELETE` | `/api/students/:id` | Teacher | Removes a student. |

### 4.3 Assignments

| Method | Route | Required role | Description |
|---|---|---|---|
| `GET` | `/api/assignments` | Student, Teacher | A student sees their own; a teacher sees all the ones they created. |
| `POST` | `/api/assignments` | Teacher | Creates a new assignment. |
| `PATCH` | `/api/assignments/:id` | Teacher | Edits an existing assignment. |
| `DELETE` | `/api/assignments/:id` | Teacher | Deletes an assignment. |
| `POST` | `/api/assignments/:id/submit` | Student | Submits/completes their own assignment; triggers rewards (coins, Pancho stats). |

### 4.4 Cross-cutting security to implement

- **`helmet`:** global Express middleware (`app.use(helmet())`) for secure HTTP headers by default (CSP, `X-Content-Type-Options`, etc.).
- **NoSQL injection protection:** sanitize `req.body`, `req.query` and `req.params` (e.g. with `express-mongo-sanitize`) before building any Mongoose query, to neutralize operators (`$gt`, `$ne`, etc.) injected from the client.
- **XSS protection:** validate and escape any free text the user enters (Pancho name, assignment answers) both when saving it and when rendering it; never use `dangerouslySetInnerHTML` in the frontend with unsanitized user data.
- **JWT:** sign with a strong secret from an environment variable, short expiration + refresh strategy if applicable, and a reusable `authenticate` + `authorize(role)` middleware on all private routes.
- **CORS:** explicitly restricted to the deployed frontend's domain.
- **Input validation:** a schema per endpoint (`zod`/`joi`/`express-validator`) before touching the database.

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

**Deployment (Vercel):** a single project serves the frontend and the API from the repository root (Framework Preset: Vite, build `npm run build`, output `dist`). See section 5.2.

```bash
npm run deploy
```


### 5.2 Backend and Full Stack deployment on Vercel

```bash
npm install
cp .env.example .env
npm run dev:server
npm run dev
```

The API listens on `http://localhost:3000`; Vite proxies `/api` to it. Environment variables (do not commit `.env`):

| Variable | Description |
|---|---|
| `MONGODB_URI` | Connection string to MongoDB Atlas. |
| `JWT_SECRET` | Secret to sign/verify tokens. Required: without it login and register fail with `500`. |
| `TEACHER_CODE` | Code a teacher must enter to register. |
| `PORT` | Local API port (`3000`). |
| `ALLOWED_ORIGINS` | Optional extra allowed origins; normally empty because frontend and API share a domain. |

Vercel: leave Root Directory empty, load the variables in the dashboard (never in the repo), and allow `0.0.0.0/0` in Atlas Network Access. Delivery URL: pending.
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
| 2026-11-02 | Nicolás (assisted) | UN-003: route table aligned with `routesConfig.jsx` (`teacher` role on `/teachersPark`, `/dogpark` as a redirect); removal of `dogParkAuth.js`, `useDogParkAccess.js` and `pages/dogpark/` (incl. `DogParkPlaceholder`) documented; authentication section and hook list updated; `useDogImages` explanation completed (dependencies, cleanup, abort and listeners). | Documentation matches `origin/main`. The session stays 🟡 until UN-104 exists. | ✅ Done |
| 2026-10-05 | Claude (assisted) | Style unification toward Tailwind CSS: the flat CSS injected in `AboutUs` was removed (`about/styles/*.js`, `usePageStyles.js`) and `AboutNav/Hero/Team/Project/FaqSection` were rewritten in pure Tailwind; `PanchoStatusBanner` moved its hex colors and `@keyframes` to `tailwind.config.js`. | Section 2.1.2 updated (the `usePageStyles` hook no longer exists). No visual or functional change for the user. | ✅ Done |
| 2026-10-05 | Claude (assisted) | Repository cleanup: `_bmad/` and the stray file `"tash push -m..."` (both tracked in git) were removed. A deployment bug from a previous session was also fixed: the backgrounds of `RaisePancho` and `PanchoStats` used absolute paths (`bg-[url('/images/...')]`) that broke under the GitHub Pages subdirectory. | Repository without tool files foreign to the project. The backgrounds of those two pages now do load on the published site. | ✅ Done |
| 2026-10-05 | Claude (assisted) | Re-render optimization and dependency cleanup: `GameStateContext` memoizes the context value (`useMemo`) instead of rebuilding it on every render; the 8 `useEffect`s that had `eslint-disable react-hooks/exhaustive-deps` were fixed, adding the real dependencies where it was safe to do so. | Fewer unnecessary re-renders in all consumers of `useGameState()`. Code without silenced lint warnings. | ✅ Done |
| 2026-10-05 | Claude (assisted) | New Mini Games section: working quiz (`src/pages/minigames/`) integrated into the already existing `/minigames` route, with a new `awardMinigameCoins` action in `state/actions/minigames.js` that awards coins (up to the cap already documented in the FAQ: +5 per mini game). | Section 2.1.3 (new) documents the flow. Still 100% frontend/`localStorage` (Phase 1); it does not touch anything from Phase 2. | ✅ Done |
| | | | | |