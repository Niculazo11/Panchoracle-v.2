# Panchoracle — User Stories & Acceptance Criteria (v2.5)

**Technical Product Specification** | **Organization:** DSAW-2026-2

---

## 1. Product Vision & User Personas

### Product Vision Overview
Panchoracle bridges classroom task management with a care-and-simulation virtual pet mechanic centered around "Pancho," an interactive virtual dachshund. Designed to tackle widespread student disengagement and delayed assignment tracking, Panchoracle translates academic progression directly into pet vitality metrics (Hunger, Health, and Status).

By linking step-by-step assignment completion and deadline adherence directly to Pancho's survival, the platform creates an immediate, empathetic feedback loop. Students earn virtual currency via educational study minigames to customize their companion, while teachers gain real-time visual telemetry into student engagement, allowing proactive interventions before academic failure occurs.

### User Personas

#### Guest / Unauthenticated Visitor
- **Description:** Prospective students, instructors, or system evaluators navigating the platform's public surface.
- **Core Objectives:** Evaluate platform features via the landing page, review the educational vision and Figma prototypes, and initiate secure registration or login workflows.
- **Access Level:** Unauthenticated public routes (`/`, `/about`, `/login`, `/register`).

#### Student (`role: "student"`)
- **Description:** Primary learners enrolled in one or more virtual classrooms.
- **Core Objectives:** Join classrooms via a unique 6-character code, maintain Pancho's health and hunger by completing multi-step assignments before `dueAt`, earn virtual coins in quiz minigames, and equip cosmetic items (hats, glasses, backgrounds) purchased from the Store.
- **Access Level:** Authenticated student routes (`/dashboard`, `/assignments`, `/store`, `/minigames`, `/stats/:username`).

#### Teacher (`role: "teacher"`)
- **Description:** Classroom instructors and academic supervisors.
- **Core Objectives:** Establish classrooms, author and publish multi-step assignments with fixed deadlines, track real-time pet vitality across their student roster (TeachersPark) as a proxy for academic risk, and issue targeted health restorations to struggling students before pet mortality occurs.
- **Access Level:** Authenticated teacher routes (`/teacher/dashboard`, `/teacher/classrooms`, `/teacher/assignments`).

---

## 2. Epic A: Authentication, Access Control & Role Routing (US-01 to US-04)

| ID | User Story | Role | Acceptance Criteria | Linked Tickets |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | As a prospective student, I want to register an account with a unique username and password, so that I can access the platform and adopt my virtual pet. | Student | **Given** an unauthenticated visitor on `/register`, **When** valid credentials are submitted and processed, **Then** the server creates the student profile, sets an `httpOnly` session cookie, and redirects to `/dashboard`. | `UN-104`, `UN-201`, `UN-202` |
| **US-02** | As an instructor, I want to register an account using a valid system teacher code, so that I can access classroom management and authorization tools. | Teacher | **Given** an unauthenticated visitor selecting the Teacher role on `/register`, **When** a valid `TEACHER_CODE` is supplied during registration, **Then** the account is created with `role: "teacher"` and granted access to `/teacher/dashboard`. | `UN-104`, `UN-203` |
| **US-03** | As a system user, I want routes restricted by role and automatic session invalidation, so that unauthorized access is prevented and expired sessions exit cleanly. | All Roles | **Given** an authenticated user or expired session, **When** accessing a restricted route or encountering a `401 Unauthorized` API response, **Then** the system emits `auth:expired`, clears local session state, and redirects to `/login`. | `UN-201`, `UN-204`, `UN-205` |
| **US-04** | As a student, I want to join a classroom using a 6-character join code, so that my enrollment is linked and my virtual pet is automatically initialized. | Student | **Given** an authenticated student entering a valid 6-character `joinCode`, **When** the enrollment request succeeds, **Then** the backend executes `ensurePet`, instantiating Pancho with default stats if no pet exists, and links the student to the classroom. | `UN-106`, `UN-402` |

---

## 3. Epic B: Virtual Pet Care, Biological Simulation & Customization (US-05 to US-09)

| ID | User Story | Role | Acceptance Criteria | Linked Tickets |
| :--- | :--- | :--- | :--- | :--- |
| **US-05** | As a student, I want to adopt and name a custom Pancho dachshund avatar, so that I can personalize my virtual learning companion. | Student | **Given** a newly registered student initializing their pet, **When** choosing a pet name and fetching avatar assets via the Dog CEO API, **Then** Pancho is persisted with the selected name, chosen breed variation, default 100% Hunger, 100% Health, and `ALIVE` status. | `UN-301`, `UN-303`, `PRE-203` |
| **US-06** | As a student, I want real-time monitoring of Pancho's hunger, health, and living status, so that I am continuously aware of my pet's state. | Student | **Given** an active student session on any authenticated view, **When** background polling (`usePolling`) executes at specified intervals, **Then** Pancho's Hunger, Health, and Status (`ALIVE` / `DEAD`) update dynamically without full page reloads. | `UN-108`, `UN-305` |
| **US-07** | As a student, I want to play educational quiz minigames to earn virtual coins, so that I can purchase store items while reinforcing learning. | Student | **Given** a student participating in a quiz minigame, **When** answers are validated server-side within rate limits (30s cooldown, max 10 plays/day), **Then** earned coins are credited to the student balance; excess requests return `429 Too Many Requests`. | `UN-501`, `UN-502` |
| **US-08** | As a student, I want to buy and equip cosmetics from the Store using coins, so that I can visually customize Pancho's appearance. | Student | **Given** a student with sufficient coin balance in the Store, **When** purchasing and equipping an item (hat, glasses, outfit, background), **Then** the coin balance is deducted, ownership is registered, and Pancho's rendered avatar reflects the equipped items. | `UN-301`, `UN-302`, `UN-303` |
| **US-09** | As a user, I want to view public pet profile summaries at `/stats/:username`, so that I can inspect peer achievements and companion stats. | All Roles | **Given** a request to navigate to `/stats/:username`, **When** the username resolves in the system database, **Then** a read-only profile display renders Pancho's level, equipped cosmetics, current vitality metrics, and academic milestones. | `PRE-201`, `UN-703` |

---

## 4. Epic C: Academic Assignments & Multi-Step Progression (US-10 to US-12)

| ID | User Story | Role | Acceptance Criteria | Linked Tickets |
| :--- | :--- | :--- | :--- | :--- |
| **US-10** | As a student, I want to view active classroom assignments, deadlines, and step requirements, so that I can plan my academic tasks effectively. | Student | **Given** a student enrolled in active classrooms, **When** navigating to the assignments view, **Then** all assigned tasks display title, description, step-by-step requirements, and UTC deadline timestamp (`dueAt`). | `UN-107`, `UN-304` |
| **US-11** | As a student, I want to complete assignment steps and submit final work before `dueAt`, so that I restore Pancho's hunger and protect their health. | Student | **Given** an open assignment with incomplete steps, **When** stepping via `POST /api/assignments/:id/steps` and submitting via `POST /api/assignments/:id/submit` prior to `dueAt`, **Then** Pancho's Hunger restores to 100%, health decay pauses, and status reflects completed work. | `UN-107`, `UN-108` |
| **US-12** | As a student, I want overdue assignments and pet mortality handled transparently, so that I understand the academic and biological state consequences. | Student | **Given** an assignment where `dueAt` passes without full submission, **When** scheduled health evaluation processes run, **Then** Hunger drops to 0%, Health decays incrementally, and reaching 0% Health transitions Pancho to permanent `DEAD` state per `ADR 5.4`. | `UN-108`, `UN-109` |

---

## 5. Epic D: Teacher Classroom Management & Student Intervention (US-13 to US-16)

| ID | User Story | Role | Acceptance Criteria | Linked Tickets |
| :--- | :--- | :--- | :--- | :--- |
| **US-13** | As a teacher, I want to create and manage classrooms with unique join codes, so that I can organize my student cohorts. | Teacher | **Given** an authenticated teacher on `/teacher/classrooms`, **When** creating a new classroom entity, **Then** the system generates a unique 6-character alphanumeric `joinCode` and registers the teacher as administrator. | `UN-106`, `UN-401` |
| **US-14** | As a teacher, I want to author, edit, and delete multi-step assignments with fixed due dates, so that I can structure coursework for my classrooms. | Teacher | **Given** a teacher managing a classroom, **When** authoring or modifying an assignment with explicit `dueAt` dates and multi-step checklists, **Then** assignment data persists and immediately synchronizes to enrolled student dashboards. | `UN-107`, `UN-404`, `UN-405` |
| **US-15** | As a teacher, I want to inspect the classroom roster (TeachersPark) for student pet vitality, so that I can identify academically at-risk students in real time. | Teacher | **Given** a teacher viewing TeachersPark for a classroom, **When** roster data renders, **Then** students are sorted/filterable by pet Health and Hunger, visual alerts flag decaying pets, and submission metrics display. | `UN-106`, `UN-401`, `UN-403` |
| **US-16** | As a teacher, I want to grant positive health restorations to living student pets, so that I can intervene and assist struggling students. | Teacher | **Given** an `ALIVE` pet of an at-risk student, **When** invoking `POST /api/classrooms/:id/students/:studentId/restore-health`, **Then** health is restored, the action is logged in `healthRestoreLog`, and requests for `DEAD` pets return `409 Conflict`. | `UN-108`, `UN-406` |

---

## 6. Epic E: Accessibility, User Experience & Platform Reliability (US-17 to US-19)

| ID | User Story | Role | Acceptance Criteria | Linked Tickets |
| :--- | :--- | :--- | :--- | :--- |
| **US-17** | As a user, I want to toggle between Light and Dark Mode across all views, so that I can customize visual comfort and readability. | All Roles | **Given** any user navigating the application interface, **When** toggling the theme switch component, **Then** the color scheme dynamically updates between Light and Dark themes, persisting the preference in local storage. | `PRE-202`, `UN-407` |
| **US-18** | As a user with accessibility needs, I want semantic HTML5 landmarks and screen-reader accessibility, so that I can navigate the application using assistive technologies. | All Roles | **Given** navigation via keyboard or screen-reader devices, **When** traversing page content, **Then** structural landmarks (`<main>`, `<nav>`, `<footer>`), ARIA labels, focus traps, and high-contrast indicators function correctly. | `UN-703` |
| **US-19** | As a visitor or student, I want to access the About page and interactive Figma prototypes, so that I can review product vision and architectural documentation. | All Roles | **Given** a visitor accessing `/about` or global help links, **When** selecting documentation resources, **Then** complete project background, architectural objectives, comparison matrices, and external Figma design embeds render. | `UN-701`, `UN-702` |

---

## 7. Traceability Matrix Summary

| User Story ID | System Roles | API Endpoints & Routes | Implementation Tickets |
| :--- | :--- | :--- | :--- |
| **US-01** | Student | `POST /api/auth/register`, `/register` | `UN-104`, `UN-201`, `UN-202` |
| **US-02** | Teacher | `POST /api/auth/register-teacher`, `/register` | `UN-104`, `UN-203` |
| **US-03** | All Roles | `POST /api/auth/logout`, `GET /api/auth/me` | `UN-201`, `UN-204`, `UN-205` |
| **US-04** | Student | `POST /api/classrooms/join` | `UN-106`, `UN-402` |
| **US-05** | Student | `POST /api/pets/adopt`, `GET /api/external/dog-ceo` | `UN-301`, `UN-303`, `PRE-203` |
| **US-06** | Student | `GET /api/pets/status` | `UN-108`, `UN-305` |
| **US-07** | Student | `POST /api/minigames/submit-quiz` | `UN-501`, `UN-502` |
| **US-08** | Student | `GET /api/store/items`, `POST /api/store/buy` | `UN-301`, `UN-302`, `UN-303` |
| **US-09** | All Roles | `GET /api/users/:username/stats`, `/stats/:username` | `PRE-201`, `UN-703` |
| **US-10** | Student | `GET /api/assignments` | `UN-107`, `UN-304` |
| **US-11** | Student | `POST /api/assignments/:id/steps`, `POST /api/assignments/:id/submit` | `UN-107`, `UN-108` |
| **US-12** | Student | `GET /api/assignments/overdue` | `UN-108`, `UN-109` |
| **US-13** | Teacher | `POST /api/classrooms`, `/teacher/classrooms` | `UN-106`, `UN-401` |
| **US-14** | Teacher | `POST /api/assignments`, `PUT /api/assignments/:id`, `DELETE /api/assignments/:id` | `UN-107`, `UN-404`, `UN-405` |
| **US-15** | Teacher | `GET /api/classrooms/:id/roster`, `/teacher/park` | `UN-106`, `UN-401`, `UN-403` |
| **US-16** | Teacher | `POST /api/classrooms/:id/students/:studentId/restore-health` | `UN-108`, `UN-406` |
| **US-17** | All Roles | N/A (Client Preferences) | `PRE-202`, `UN-407` |
| **US-18** | All Roles | Application DOM Structure | `UN-703` |
| **US-19** | All Roles | `/about` | `UN-701`, `UN-702` |