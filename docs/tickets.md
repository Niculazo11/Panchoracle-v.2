# Panchoracle — Unified Ticket Sheet (Complete History v5)

This document provides a comprehensive, centralized record of all engineering and design activities for the Panchoracle virtual pet educational platform. It consolidates the complete project lifecycle across legacy static phases, framework migrations, and the current full-stack MERN (MongoDB, Express, React, Node.js) implementation.

---

## 1. Executive Summary & Team Ownership

- **Project Title:** Raise a Pancho / Panchoracle
- **GitHub Repository:** `DSAW-2026-2`
- **Document Version:** 5.0 (Integrated Unified Sheet)
- **Architecture Base:** Node.js Express REST API, MongoDB Atlas, React 18 (Vite + Tailwind CSS), Vercel Functions deployment.

### Core Team Roles & Responsibilities

| Team Member | Core Primary Responsibilities | Lead Technical Domains |
| :--- | :--- | :--- |
| **Nicolás** | Lead Developer, QA & DevOps | System planning, user story definition, vanilla JS state engine, React migration, Vercel deployments, database seeding scripts (`seed.js`), automated test suites, security auditing, and QA traceability matrices. |
| **Karol** | Backend & Security Architect | Base HTML/CSS layouts, Express backend architecture, Mongoose schemas and data modeling, JWT authentication (`httpOnly` cookie transport), security middlewares (rate limiting, NoSQL injection prevention), and server-side biological decay engines. |
| **Isaac** | Frontend Developer & Support | Legacy bug fixing, dark mode system architecture, global theme context, React API client integration, background polling hooks (`usePolling`), global game state contexts, and minigame frontend logic. |
| **Mariana** | UI/UX Designer & Product Owner | Visual design systems in Figma, UI component style guides, interactive prototyping, student/teacher UX flows, classroom management dashboards, role-based navigation, and accessibility audits. |

---

## 2. Historical Phase 1: Ideation, Planning, and UI/UX Design (Pre-Sprint)

This initial phase focused on scope definition, pedagogical justification, user story mapping, and high-fidelity prototyping within Figma.

| ID | Phase / Sprint | Task / User Story | Owner | SP / Priority | Status | Evidence / Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PRE-001** | Pre-Sprint | Initial project planning, detailed milestone schedule, and technical system scope. | Nicolás | 5 SP / High | Completed | Approved project scope document and project schedule committed to repository. |
| **PRE-002** | Pre-Sprint | Problem statement and pedagogical justification for the virtual pet classroom platform. | Nicolás | 3 SP / Medium | Completed | Conceptual framework and classroom educational use case documentation finalized. |
| **PRE-003** | Pre-Sprint | Definition of user stories and role-based user flow diagrams (Student vs. Teacher). | Nicolás | 5 SP / High | Completed | Formalized backlog of user stories complete with explicit acceptance criteria. |
| **PRE-004** | Pre-Sprint | Visual identity, color palette, component design, and interactive prototype in Figma. | Mariana | 8 SP / High | Completed | Interactive Figma prototype URL with standardized design tokens and UI components. |

---

## 3. Historical Phase 2: Static Web Prototype (HTML, CSS, and Vanilla JavaScript)

Phase 2 produced a proof-of-concept client-side prototype establishing core game loops, visual layouts, and state manipulation without backend dependencies.

| ID | Phase / Sprint | Task / User Story | Owner | SP / Priority | Status | Evidence / Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PRE-101** | Static Phase | Semantic HTML5 structures and base CSS stylesheets for main views (Home, Login, Raise, Shop, Stats, About). | Karol | 8 SP / High | Completed | Responsive, cross-browser compatible HTML/CSS views delivered in the `/static` directory. |
| **PRE-102** | Static Phase | Client-side game engine in vanilla JS (pet lifecycle timers, shop, currency balance, `localStorage`). | Nicolás | 8 SP / High | Completed | Functional DOM-manipulating game loop persisting pet stats and items locally. |
| **PRE-103** | Static Phase | Cross-browser rendering fixes, timer bug adjustments, and CSS layout stabilization across static views. | Isaac | 3 SP / Medium | Completed | Bug fixes applied to legacy timer routines and flexbox layout inconsistencies. |

---

## 4. Historical Phase 3: Migration to React + Vite + Tailwind & Dark Mode

Phase 3 transitioned the static assets into a modern Single Page Application (SPA) architecture, introducing dynamic routing, global theme switching, and initial external API integrations.

| ID | Phase / Sprint | Task / User Story | Owner | SP / Priority | Status | Evidence / Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PRE-201** | Migration | Architecture overhaul migrating plain HTML/JS code into modular React 18, React Router v6, and Tailwind CSS. | Nicolás | 13 SP / High | Completed | Production build operational under Vite + React with functional routing and Tailwind styling. |
| **PRE-202** | Migration | Global dark mode system implementation with client theme context and `localStorage` persistence. | Isaac | 5 SP / Medium | Completed | Theme toggle control integrated into Navbar with seamless persistence across reloads. |
| **PRE-203** | Migration | Component refactoring, external Dog CEO API integration, and post-migration state cleanup. | Isaac / Nicolás | 5 SP / Medium | Completed | Asynchronous fetch integration rendering dynamic pet images alongside cleaned component trees. |

---

## 5. Current Phase (Full-Stack MongoDB + Express + Vercel): Epics 0 to 7

The current phase represents the evolution into a secure, multi-tenant full-stack application supporting asynchronous biological pet decay, teacher/student roles, automated evaluation, and serverless edge deployment.

### Epic 0: Architecture & Base Documentation

| ID | Phase / Sprint | Task / User Story | Owner | SP / Priority | Status | Evidence / Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UN-001** | Epic 0 | Architecture Decision Records (ADR Rev 2.5) establishing MERN guidelines and standard patterns. | Karol | 3 SP / High | Completed | Formatted ADR document covering REST conventions, database schema guidelines, and security policies. |
| **UN-002** | Epic 0 | Strict enforcement of 80-line maximum rule per file/function and ESLint/Prettier configuration. | Isaac | 3 SP / Medium | In Progress | Refactoring monolithic context files into modular custom hooks; linter rules active. |
| **UN-003** | Epic 0 | Comprehensive update of `PROJECT_DOCUMENTATION.md` to align with v5 backend server features. | Nicolás | 2 SP / Medium | In Progress | Synchronized documentation reflecting database structures, API routes, and deployment pipelines. |

### Epic 1: Express Backend, MongoDB, and Serverless Infrastructure

| ID | Phase / Sprint | Task / User Story | Owner | SP / Priority | Status | Evidence / Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UN-101** | Epic 1 | Express.js server initialization adapted for Vercel serverless function entrypoints. | Karol | 5 SP / High | Completed | Entrypoint at `api/index.js` configured to execute successfully as a Vercel Serverless Function. |
| **UN-102** | Epic 1 | Schema definition for 9 Mongoose models (`User`, `Pet`, `Classroom`, `Assignment`, `Submission`, etc.) with indexing. | Karol | 8 SP / High | Completed | Strict Mongoose models with validation rules, compound indexes, and relational references. |
| **UN-103** | Epic 1 | Backend security hardening (Helmet, restricted CORS origin policy, NoSQL injection sanitization). | Karol | 5 SP / High | Completed | Express security middleware chain verifying sanitized inputs and header safety. |
| **UN-104** | Epic 1 | Authentication service issuing JWTs via `httpOnly`, `SameSite` cookies with a `/api/me` verification route. | Karol | 5 SP / High | Completed | User registration and authentication returning secure HTTP-only cookies without script exposure. |
| **UN-105** | Epic 1 | Middleware suite for authentication verification, role-based authorization, and MongoDB ObjectId validation. | Karol | 5 SP / High | Completed | Guard middlewares preventing illegal parameter payloads and unauthorized route access. |
| **UN-106** | Epic 1 | Classroom management API supporting creation, listing, and unique `joinCode` generation. | Mariana | 5 SP / High | In Progress | Endpoints allowing teachers to initialize classrooms and students to enroll via shortcodes. |
| **UN-107** | Epic 1 | CRUD API endpoints for educational assignments and multi-step student submission handling. | Isaac | 5 SP / High | Completed | Assignment submission pipeline calculating rewards and step completions server-side. |
| **UN-108** | Epic 1 | Lazy biological decay engine (hunger/health recalculation on read) and `restore-health` endpoint. | Karol | 8 SP / High | Completed | Server recalculates state lazily based on elapsed timestamps; teacher health restore route active. |
| **UN-109** | Epic 1 | Endpoint to revive deceased pets through coin expenditure. | Karol | — / Low | Discarded | Discarded per ADR 5.4: Pet mortality is permanent; health restoration applies only to living pets. |
| **UN-110** | Epic 1 | Vercel production deployment connected to remote MongoDB Atlas cluster. | Nicolás | 5 SP / High | In Progress | Operational production endpoint passing `/api/health` queries linked to MongoDB Atlas. |
| **UN-111** | Epic 1 | Reproducible database seed script (`seed.js`) generating complete test environments. | Nicolás | 3 SP / Medium | In Progress | Command `npm run seed -- --yes` populating test accounts, classrooms, assignments, and pets. |

### Epic 2: Authentication, Session, and Role-Based Routing

| ID | Phase / Sprint | Task / User Story | Owner | SP / Priority | Status | Evidence / Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UN-201** | Epic 2 | Centralized HTTP client (`api.js`) featuring automatic cookie handling and custom `auth:expired` event dispatching. | Isaac | 5 SP / High | Completed | Fetch wrapper automatically attaching credentials and intercepting `401 Unauthorized` responses. |
| **UN-202** | Epic 2 | Global session state management via `AccessContext` to expose user profiles and role scopes. | Isaac | 5 SP / High | Completed | React context propagating user identity, authentication state, and role checks across components. |
| **UN-203** | Epic 2 | Authentication UI forms supporting role selection (Student vs. Teacher) and teacher validation codes. | Mariana | 5 SP / High | In Progress | Dynamic forms delivering client validation, role toggles, and inline error feedback. |
| **UN-204** | Epic 2 | Declarative route guards for React Router to restrict access by role and parameter validity. | Mariana | 5 SP / High | Completed | Route wrapper components intercepting unauthorized users and redirecting to fallback routes. |
| **UN-205** | Epic 2 | Navbar component with dynamic conditional link rendering matching user session and role. | Mariana | 3 SP / Medium | In Progress | Header navigation dynamically adjusting visible links based on authenticated user capabilities. |

### Epic 3: API Game State Integration & Background Synchronization

| ID | Phase / Sprint | Task / User Story | Owner | SP / Priority | Status | Evidence / Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UN-301** | Epic 3 | Client interaction layer (`gameService.js`) wrapping pet feeding, shop actions, and customization endpoints. | Isaac | 5 SP / High | Completed | Modular service layer encapsulating asynchronous game requests and server payloads. |
| **UN-302** | Epic 3 | Data translation layer (`gameApi.js`) converting raw database objects into standardized UI models. | Isaac | 3 SP / Medium | Completed | Data transformation functions standardizing server response structures for frontend components. |
| **UN-303** | Epic 3 | Implementation of `GameStateContext` managing pet vitality, active items, and balance. | Isaac | 5 SP / High | Completed | Global state management for hunger rates, health metrics, inventory management, and coins. |
| **UN-304** | Epic 3 | Asynchronous state feedback UI components (skeletons, spinners, error banners). | Mariana | 3 SP / Medium | In Progress | User experience feedback elements indicating network transactions and error states. |
| **UN-305** | Epic 3 | Continuous synchronization custom hook (`usePolling`) to refresh pet status in background. | Isaac | 5 SP / High | Completed | Background hook updating pet vitality status on `RaisePancho` and `PanchoStats` screens. |

### Epic 4: Teacher Dashboard and Classroom Management

| ID | Phase / Sprint | Task / User Story | Owner | SP / Priority | Status | Evidence / Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UN-401** | Epic 4 | Main teacher management dashboard (`TeachersPark`) presenting aggregated classroom metrics. | Mariana / Isaac | 8 SP / High | Completed | Dashboard aggregating average classroom pet health, completion rates, and active alerts. |
| **UN-402** | Epic 4 | Student classroom enrollment UI flow consuming standard `joinCode` values. | Mariana | 3 SP / Medium | Completed | Student modal allowing code submission and instant enrollment feedback. |
| **UN-403** | Epic 4 | Roster view displaying detailed student lists alongside respective pet health metrics. | Mariana | 5 SP / Medium | Completed | Data table showing student rosters, activity logs, and real-time pet status indicators. |
| **UN-404** | Epic 4 | Assignment authoring module allowing teachers to configure tasks, due dates, and coin rewards. | Isaac | 5 SP / High | Completed | Form enabling teachers to create learning challenges linked to automated reward payouts. |
| **UN-405** | Epic 4 | Submissions review interface allowing teachers to inspect student homework and assign feedback. | Isaac | 5 SP / High | Completed | Gradebook panel displaying student work submissions and evaluation controls. |
| **UN-406** | Epic 4 | Immediate action control allowing teachers to revive deceased pets. | — | — / Low | Obsolete | Obsolete: Replaced by the `restore-health` feature for living pets per ADR 5.4 rules. |
| **UN-407** | Epic 4 | Full dark mode compatibility across all teacher management screens and modal dialogs. | Isaac | 3 SP / Medium | In Progress | Integration of Tailwind `dark:` color variants across teacher views and management components. |

### Epic 5: Minigames and Server-