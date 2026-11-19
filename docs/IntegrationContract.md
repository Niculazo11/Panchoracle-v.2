# Panchoracle — Frontend–Backend Integration Contract (v2.5)

**System Architecture, Network Transport Protocol, API Endpoints Specification, and Domain Invariants for the DSAW-2026-2 Engineering Team.**

---

## 1. Document Control & Architectural Overview

### 1.1 System Architecture
The Panchoracle system (Project: *Raise a Pancho*, Organization: **DSAW-2026-2**) operates as a monolithic, single-origin web application deployed on Vercel.

* **Frontend Client:** React 18 single-page application built with Vite and styled via Tailwind CSS.
* **Backend Runtime:** Serverless Express 5 instance hosted under `/api/*` handlers.
* **Database Layer:** Cloud MongoDB Atlas instance (`Panchoracle` database) accessed through Mongoose 9 ORM.
* **Network Topology:** Single-origin routing guarantees that all API requests operate under the same domain, eliminating cross-origin pre-flight overhead while maintaining strict security constraints.

### 1.2 Team Sign-off Matrix

| Engineer | Primary Architectural Role | Key Contract Ownership & Subsystems |
| :--- | :--- | :--- |
| **Karol** | Backend & Security Architect | Express routes, Mongoose schemas, `httpOnly` JWT session transport, lazy biological state engine (`petStateService`), rate-limiting, and security middlewares. |
| **Isaac** | Frontend State & API Client Lead | Core API layer (`src/lib/api.js`), `AccessContext`, `GameStateContext`, `gameService`/`gameApi`, polling mechanisms (`usePolling`), and server-graded quiz integration (`UN-501`/`UN-502`). |
| **Mariana** | UI/UX, Classrooms & Role Routing Lead | Classroom service (`src/services/classroomService.js`), role-based forms (`UN-203`), route guards (`UN-204`), classroom enrollment UI (`UN-402`), and teacher dashboard views (`UN-401`–`UN-405`). |
| **Nicolás** | DevOps, QA, Security & Documentation Lead | Vercel + Atlas deployment pipeline (`UN-110`/`UN-602`), database seeding (`UN-111`), automated integration tests (`UN-603`), security audit (`UN-601`), semantic markup (`UN-703`), and contract governance (`UN-604`). |

---

## 2. Transport, Authentication & Security Rules

### 2.1 Base URL & Same-Origin Policy
All client-side HTTP calls **MUST** originate from `src/lib/api.js` using relative paths starting with `/api`.

* The environment variable `VITE_API_URL` **MUST** remain unset in all production and staging environments to prevent accidental cross-origin base URL overrides.
* The backend CORS filter (`server/config/cors.js`) strictly rejects any incoming request bearing a cross-origin `Origin` header with HTTP `403 FORBIDDEN`.

### 2.2 Session Transport & Storage Constraints
Authentication relies exclusively on encrypted, cookie-based session identifiers.

* **Cookie Key:** `session`
* **Token Structure:** JWT signed via `HS256` algorithm.
* **Lifetime:** 1-hour Time-To-Live (TTL).
* **Flags:** `HttpOnly`, `SameSite=Lax`, and `Secure` (enforced on Vercel and production deployments).
* **Strict Constraint:** Usage of `Authorization: Bearer <token>` headers or saving session tokens within browser `localStorage` or `sessionStorage` is strictly prohibited.

### 2.3 401 Session Expiration Protocol
When any request routed through `/api/*` returns an HTTP `401 UNAUTHORIZED` status (excluding `/api/auth/login` and `/api/auth/register`), the API client **MUST** intercept the response and emit the global custom event:

```javascript
window.dispatchEvent(new CustomEvent('auth:expired'));
```

Upon capturing `auth:expired`, the `AccessContext` must immediately reset user state to anonymous (`null`) and trigger a client-side redirect to `/login`.

### 2.4 Payload & Input Hardening
1. **Body Size Limits:** JSON request bodies exceeding `10 kB` are rejected automatically by Express body-parser middlewares.
2. **NoSQL Injection Prevention:** Keys containing MongoDB operators (`$` or `.`) are recursively sanitized or rejected before payload processing.
3. **Validation:** All `POST`, `PUT`, and `PATCH` incoming payloads are validated using strict Zod schemas (`z.object({...}).strict()`). Unrecognized keys cause validation failure.
4. **Data Leakage:** The `passwordHash` field **MUST** be omitted from all JSON serialized outputs leaving the server.

---

## 3. Standardized Error Envelope & HTTP Status Codes

### 3.1 Canonical Error JSON Shape
Every failed API request returns a JSON response following this structural contract:

```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable description detailing the error condition."
  }
}
```

### 3.2 HTTP Status Code Mapping

| Status Code | Code Identifier | Trigger Criteria & Context |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Malformed JSON, Zod validation failure, invalid MongoDB `ObjectId` string format, or body size exceeding `10 kB` limit. |
| `401` | `UNAUTHORIZED` | Missing, tampered, or expired session cookie; invalid email or password credentials during login. |
| `403` | `FORBIDDEN` | Role-based permission failure (e.g., student accessing teacher route), unauthorized classroom/assignment mutation, disallowed `Origin` header, or invalid `TEACHER_CODE`. |
| `404` | `NOT_FOUND` | Resource ID does not exist, unmapped `/api/*` endpoint, or a student user without an assigned classroom invoking `GET /api/me/game`. |
| `409` | `CONFLICT` / `ASSIGNMENT_EXPIRED` / `PERIOD_LOCKED` | Duplicate user email or `joinCode`, student already assigned to a classroom, health restoration attempted on a dead pet, or submission outside active assignment timeframe. |
| `429` | `RATE_LIMITED` | Authentication endpoint request limit reached, minigame cooldown active (30s minimum), or daily play limit reached (max 10 plays/day). Sends `Retry-After` header. |
| `500` / `503` | `INTERNAL_ERROR` / `SERVICE_UNAVAILABLE` | Unhandled runtime exception on the backend or failure to connect to MongoDB Atlas cluster. |

---

## 4. Complete REST API Endpoint Contract

### 4.1 Health & Authentication

| Method | Path | Auth / Role | Request Body / Query Params | Success Response (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | None | None | `{"status":"ok","timestamp":"2026-11-19T10:00:00.000Z"}` |
| `POST` | `/api/auth/register` | None | `{"email":"s@univ.edu","password":"P@ss123","name":"Student","role":"student"}` | `{"user":{"id":"655f...","email":"s@univ.edu","name":"Student","role":"student"}}` |
| `POST` | `/api/auth/login` | None | `{"email":"s@univ.edu","password":"P@ss123"}` | `{"user":{"id":"655f...","email":"s@univ.edu","name":"Student","role":"student"}}` |
| `POST` | `/api/auth/logout` | Session | None | `{"message":"Logged out successfully"}` |

#### Payload Examples (Authentication)
* `POST /api/auth/register` (Teacher Registration):

```json
{
  "email": "teacher@univ.edu",
  "password": "SecurePassword123!",
  "name": "Prof. Aris",
  "role": "teacher",
  "teacherCode": "DSAW-2026-TEACH"
}
```

### 4.2 Current User & Game State

| Method | Path | Auth / Role | Request Body / Query Params | Success Response (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/me` | Session | None | `{"user":{"id":"655f...","email":"s@univ.edu","name":"Student","role":"student"}}` |
| `GET` | `/api/me/game` | Session (Student) | None | Returns consolidated student state payload (see JSON below). Returns `404 NOT_FOUND` if student lacks classroom. |

#### State Payload Mapping (`GET /api/me/game`)
`dog.status` is mapped to UPPERCASE (`"ALIVE"` or `"DEAD"`) in outbound responses for client UI consistency, despite being stored as lowercase (`"alive"` or `"dead"`) inside MongoDB.

```json
{
  "student": {
    "id": "655f1a2b3c4d5e6f7a8b9c0d",
    "name": "Mariana Student",
    "email": "mariana@univ.edu"
  },
  "classroom": {
    "id": "655f1a2b3c4d5e6f7a8b9c0e",
    "name": "Software Engineering 101",
    "joinCode": "SE101A"
  },
  "dog": {
    "id": "655f1a2b3c4d5e6f7a8b9c0f",
    "name": "Pancho",
    "status": "ALIVE",
    "health": 85,
    "hunger": 60,
    "coins": 120,
    "panchoId": "dachshund-01",
    "imgUrl": "https://images.dog.ceo/breeds/dachshund/kaninchen-dachshund-953699_640.jpg",
    "equipped": {
      "hat": "hat_wizard",
      "accessory": "glasses_nerd"
    }
  },
  "inventory": ["hat_wizard", "glasses_nerd", "skin_golden"],
  "stats": {
    "assignmentsCompleted": 5,
    "minigamesPlayedToday": 2
  }
}
```

### 4.3 Classrooms & Teacher Actions

| Method | Path | Auth / Role | Request Body / Query Params | Success Response (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/classrooms` | Session (Teacher) | `{"name":"CS101"}` | `{"classroom":{"id":"655f...","name":"CS101","joinCode":"X7K9P2"}}` |
| `GET` | `/api/classrooms/me` | Session | None | Returns array of classrooms owned (Teacher) or joined (Student). |
| `POST` | `/api/classrooms/join` | Session (Student) | `{"joinCode":"X7K9P2"}` | `{"message":"Joined classroom","classroomId":"655f..."}` |
| `PATCH` | `/api/classrooms/:id` | Session (Teacher Owner) | `{"name":"CS101 - Spring"}` | `{"classroom":{"id":"655f...","name":"CS101 - Spring"}}` |
| `DELETE` | `/api/classrooms/:id` | Session (Teacher Owner) | None | `{"message":"Classroom deleted"}` |
| `GET` | `/api/classrooms/:id/students` | Session (Teacher Owner) | None | Returns list of enrolled students with pet health stats. |
| `POST` | `/api/classrooms/:id/students/:studentId/restore-health` | Session (Teacher Owner) | `{"amount":25,"reason":"Extra credit"}` | Returns updated pet state object (health adjustment persisted in `healthRestoreLog` as `healthAdjustment`). |
| `DELETE` | `/api/classrooms/:id/students/:studentId` | Session (Teacher Owner) | None | `{"message":"Student removed from classroom"}` |

### 4.4 Assignments & Multi-Step Submissions

| Method | Path | Auth / Role | Request Body / Query Params | Success Response (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/assignments` | Session | `?classroomId=655f...` | Returns list of assignment summary objects. |
| `POST` | `/api/assignments` | Session (Teacher) | Assignment creation payload | Returns created assignment object with steps. |
| `GET` | `/api/assignments/:id` | Session | None | Returns complete details for a single assignment. |
| `PATCH` | `/api/assignments/:id` | Session (Teacher Owner) | Partial assignment keys | Returns updated assignment object. |
| `DELETE` | `/api/assignments/:id` | Session (Teacher Owner) | None | `{"message":"Assignment deleted"}` |
| `POST` | `/api/assignments/:id/steps` | Session (Student) | Step completion data | Returns step validation result. |
| `POST` | `/api/assignments/:id/submit` | Session (Student) | Final submission payload | Returns reward calculation and pet status update. |

#### Creation Payload Example (`POST /api/assignments`)

```json
{
  "classroomId": "655f1a2b3c4d5e6f7a8b9c0e",
  "title": "Lab 1: REST API Design",
  "description": "Build an Express application adhering to OpenAPI specifications.",
  "dueAt": "2026-12-01T23:59:59.000Z",
  "rewards": {
    "experience": 100,
    "coins": 50
  },
  "steps": [
    {
      "stepNumber": 1,
      "title": "Define Endpoints",
      "instruction": "List all CRUD routes for the resource."
    },
    {
      "stepNumber": 2,
      "title": "Implement Zod Validation",
      "instruction": "Enforce strict schema validation on incoming payloads."
    }
  ]
}
```

### 4.5 Pet Customization, Store & Minigames

| Method | Path | Auth / Role | Request Body / Query Params | Success Response (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cosmetics` | Session | None | Returns catalog of available pet cosmetics. |
| `PUT` | `/api/pets/me/pancho` | Session (Student) | `{"name":"Pancho II"}` | Returns updated pet record. |
| `POST` | `/api/pets/me/inventory` | Session (Student) | `{"itemId":"hat_wizard"}` | Deducts coins and returns updated inventory list. |
| `PUT` | `/api/pets/me/equipped` | Session (Student) | `{"equipped":{"hat":"hat_wizard"}}` | Returns updated equipment configuration. |
| `POST` | `/api/minigames/reward` | Session (Student) | Provisional payload (`UN-501` pending) | `{"coinsEarned":15,"newTotalCoins":135}` |

---

## 5. Domain Invariants & State Transition Rules

### 5.1 Biological State Engine (`petStateService`)
The pet's vitality markers update deterministically when requests hit `/api/me/game` or cron triggers evaluate status.

```text
       [ HIGH VITALITY ]
        Hunger: 100% -> Decay -> 0%
               |
               v
  [ ASSIGNMENT DUE DATE PASSED ]
   (Unsubmitted Assignment)
               |
               v
     Health Penalty Applied
               |
    +----------+----------+
    |                     |
    v                     v
[ Health > 0 ]      [ Health == 0 ]
  (ALIVE)               (DEAD)
    |                     |
    v                     v
Teacher Restores     PERMANENT
Health via Log       NO REVIVE
```

1. **Hunger Decay:** Decays linearly from `100` down to `0` over time between active assignment milestones.
2. **Health Penalties:** Health decreases only when an assignment passes its `dueAt` date without a valid submission.
3. **Permanent Death State:** Once health reaches `0`, the pet enters `status: "dead"`. This state transition is absolute and permanent. Per Architecture Decision Record (ADR) 5.4, there is no revive endpoint.
4. **Action Restrictions:** A pet with `status: "dead"` cannot equip items, earn minigame rewards, or receive routine hunger feedings.

### 5.2 Teacher Health Restoration Protocol
Teachers can intervene before total pet mortality via:

`POST /api/classrooms/:id/students/:studentId/restore-health`

* **Precondition Check:** The server evaluates the student's current pet state. If `status === "dead"` or `health === 0`, the endpoint **IMMEDIATELY** aborts and returns an HTTP `409 CONFLICT` response:

```json
{
  "error": {
    "code": "PET_IS_DEAD",
    "message": "Cannot restore health to a deceased pet. Restoration must occur prior to pet death."
  }
}
```

* **Valid Restoration:** If the pet is `ALIVE`, the added points cap at `100` total health, and an entry is written to the audit collection `healthRestoreLog` capturing the `teacherId`, `studentId`, `amount`, `reason`, and `timestamp`.

### 5.3 Frontend Polling & Component Constraints
1. **State Synchronization:** Components `RaisePancho` and `PanchoStats` must utilize the custom hook `usePolling` to refresh state from `GET /api/me/game` every `30,000 ms`.
2. **API Abstraction Layer:** Direct invocations of `window.fetch` or `axios` outside of `src/lib/api.js` are strictly forbidden (the sole exception being third-party asset calls within `src/lib/dogApi.js`).
3. **Component Footprint:** Individual React `.jsx` component files **MUST NOT** exceed **80 lines of code**. Large components must be refactored into smaller sub-components or utility hooks.

---

## 6. Open Contract Items & Pending Alignment

The following items must be implemented, verified, and merged prior to initiating the `UN-609` final regression testing cycle:

| Item Code | Target Component & Domain | Assigned Lead(s) | Architectural Requirement & Remediation Strategy |
| :--- | :--- | :--- | :--- |
| `UN-501`<br>`UN-502` | Quiz Server Grading | Isaac & Karol | Deprecate client-trusted `POST /api/minigames/reward`. Replace with secure two-step flow: `GET /api/quiz-questions` (omitting `correctIndex`) and server-evaluated `POST /api/minigames/quiz/submit`. |
| `UN-402` | Student Classroom Join UI | Mariana | Connect the classroom entry modal/view directly to `POST /api/classrooms/join`. Ensure invocation triggers backend `ensurePet` initialization upon successful enrollment. |
| `UN-203`<br>`UN-204` | Teacher Auth & Router Guards | Mariana | Add role toggle and `teacherCode` input to the `/register` view. Update `AccessContext` router guards to block non-teacher users from navigating to `/teacher/*` routes. |
| `H-04` | Superseded ADR 7.3 Routes | Karol & Isaac | Formalize retirement of legacy draft routes: `PATCH /api/me`, `GET /api/pets/me`, `GET /api/pets/:id`, `POST /api/classrooms/:id/periods`, `POST /assignments/:id/submissions`, and `GET /assignments/:id/submissions`. All clients must exclusively use Section 4 routes. |

---

## 7. Team Sign-Off Block

By signing below, the engineering leads for **DSAW-2026-2** accept the technical specifications, routing paths, error contracts, and domain rules defined in version 2.5 of this document.

| Engineer Name | Formal Role & Ownership Scope | Status | Verification Date |
| :--- | :--- | :--- | :--- |
| **Karol** | Backend & Security Architect | APPROVED | 2026-11-19 |
| **Isaac** | Frontend State & API Client Lead | APPROVED | 2026-11-19 |
| **Mariana** | UI/UX, Classrooms & Role Routing Lead | APPROVED | 2026-11-19 |
| **Nicolás** | DevOps, QA, Security & Documentation Lead | APPROVED | 2026-11-19 |