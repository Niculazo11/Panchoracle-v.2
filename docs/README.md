# Panchoracle Milestone

## Isaac Bonilla Cerón
## Mariana González Correa
## Nicolas Moreno Parra
## Karol Dayanne Rodriguez Gonzales

Raise a Pancho: a gamified classroom app. Students adopt a virtual dachshund that reacts to their homework; teachers manage classrooms, assignments and their students' progress.

### Problem Statement

Although advances in technology have impacted a large part of the modern world, the various learning processes in educational establishments are still mainly static, passive, and separate from how today’s students are used to functioning in the digital world. Data provided by the OECD (2024) indicate that a decline in motivation, passive content consumption, and long feedback loops are detrimental for young learners in their academic engagement. Reports by UNESCO (2023) show that proper incorporation of engaging feedback methods, outside of standardized teaching procedures, helps learners retain more information and become more involved in their learning.
In conventional educational situations (for instance, while teaching introductory programming courses), the lack of engagement becomes evident even in two phases: students stall with multi-step tasks that do not offer any progress visibility and teachers are unable to identify students who are falling behind before their dropping grades. Traditional LMS systems (like Moodle and Google Classroom) can be described as passive systems offering delayed feedback. The use of Excel is not advisable either due to the absence of any interactive features.

Panchoracle has developed a full-stack web application which achieves its objectives within the context of a play, care and simulation archetype. Panchoracle is available around the clock and can be used by students both on desktop computers and mobile devices. Students are also given one companion at a time: a simulated dachshund, named Pancho, who demonstrates the health of the student and his educational performance. When the student accomplishes assignments on time, Pancho receives nutrition and maintains good health, but if the student misses deadlines, Pancho faces vitality decline. In the meantime, the students do short quizzes to earn coins and customize their pet. Teachers get a separate dashboard for monitoring students’ performance and health.

### Links

| What | URL |
|---|---|
| Site (Vercel) | `https://panchoracle-git-main-panchoracle.vercel.app/` |
| API health check | `https://panchoracle-git-main-panchoracle.vercel.app/api/health` |
| Figma Wireframe | `https://www.figma.com/site/JAjaHKcbfHas1ohly8W6hW/Wireframe?node-id=8-34&t=qdpzMr7CtS7LLqa0-1` |
| Figma Concept | `https://www.figma.com/site/gJXYreTLyKluucYUJVEeHQ/Modern-Product-Launch--Community-?node-id=0-1&t=gHpGlN8Ju5WI11cz-1` |




## Local setup

**Requirements:** Node.js 18+ and npm (MongoDB Atlas, or a local MongoDB at `mongodb://127.0.0.1:27017/panchoracle`).

```bash
npm install
cp .env.example .env     # then fill in MONGODB_URI, JWT_SECRET and TEACHER_CODE
npm run dev:server       # API on http://localhost:3000
npm run dev              # front end on http://localhost:5173 (proxies /api to the API)
```

Never commit `.env`. Do not define `VITE_API_URL`: the client uses the same-origin `/api`, and a different origin breaks the session cookie.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Atlas or local connection string. |
| `JWT_SECRET` | yes | Long random secret; without it login/register fail with `500`. |
| `TEACHER_CODE` | for teacher sign-up | Code a teacher enters when registering. |
| `PORT` | no | Local API port (default `3000`). |
| `ALLOWED_ORIGINS` | no | Extra allowed origins; normally empty. |
| `MINIGAME_COOLDOWN_MS`, `MINIGAME_MAX_PLAYS_PER_DAY` | no | Minigame limits; defaults in `server/config/game.js`. |
| `SEED_PASSWORD` | seed only | Password given to every demo account. |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server. |
| `npm run dev:server` | API with `node --watch`. |
| `npm run build` / `npm run preview` | Production build to `dist/` / serve it locally. |
| `npm test` | Whole server test suite (in-memory MongoDB; never touches `MONGODB_URI`). |
| `npm run seed -- --yes` | Recreate the demo data (see below). |
| `npm run db:check` | Check the connection to Atlas. |
| `npm run db:indexes` | Create the MongoDB indexes (required once on Atlas: `autoIndex` is off on Vercel). |

### Demo data

```bash
SEED_PASSWORD=<choose-a-password> npm run seed -- --yes
```

The script prints the target `host/db`, refuses to run without `--yes`, in production, or without `SEED_PASSWORD` (a default is only allowed for a local MongoDB). It creates a teacher (`teacher@seed.panchoracle.test`), the classroom code `SEED42` and students `ana`, `bruno`, `carla`, `diego` (dead Pancho) and `elena` at `@seed.panchoracle.test`. Dates are relative to now, so re-seed right before a demo.

## Deploy on Vercel

1. Import the repository as **one** project: Root Directory empty, Framework Preset Vite, build `npm run build`, output `dist`.
2. Set `MONGODB_URI`, `JWT_SECRET` and `TEACHER_CODE` (Production and Preview) in the Vercel dashboard. Leave `VITE_API_URL` undefined.
3. In Atlas, allow `0.0.0.0/0` under Network Access, then run `npm run db:indexes` once against the Atlas database.
4. Turn off Vercel Authentication (Deployment Protection) for Production.
5. Check `https://<your-project>.vercel.app/api/health` answers `{"status":"ok","database":"connected"}`.

## Documentation

- [`PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md): architecture, status and maintenance log.
- [`docs/api.md`](./docs/api.md): API reference (index of every real endpoint).
- [`docs/classrooms-api.md`](./docs/classrooms-api.md), [`docs/game-api.md`](./docs/game-api.md), [`docs/usePolling.md`](./docs/usePolling.md), [`docs/ADR-001-api-mongodb.md`](./docs/ADR-001-api-mongodb.md).
- [`UserStories.md`](./docs/UserStories.md): Aceptance Criteria.
- [`tickets.md`](./docs/tickets.md): Each goal of the team.
- [`IntegrationContract.md`](./docs/IntegrationContract.md): The contract in which the API will work according to.