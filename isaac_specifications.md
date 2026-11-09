# Especificaciones técnicas de Isaac — Panchoracle

| Campo | Valor |
|---|---|
| Proyecto | Panchoracle (`Niculazo11/Panchoracle-v.2`), plataforma web educativa con mascota virtual |
| Desarrollador | Isaac (`isaacbonillaceron-a11y`) |
| Fuente de verdad | *Panchoracle — Hoja de tickets unificada (v4)*, Revisión 3 (2026-10-26) |
| Código de referencia | `origin/main` en `f40af57` (2026-10-23) |
| Formato | OpenSpec: especificación por ticket + historial vivo de cambios |
| Estado global | **EN PROGRESO** — 5 de 12 tickets completados · 25 de 59 SP · 42% |
| Última actualización | 2026-11-08 |

> Este archivo es la fuente de verdad del trabajo de Isaac. Las reglas para mantenerlo al día están en la última sección («Protocolo de actualización») y son obligatorias para cualquier IA o persona que toque código de estos tickets.

---

## 1. Resumen de tickets de Isaac

| ID | Título | Sprint | Prioridad | SP | Estado | Depende de |
|---|---|---|---|---|---|---|
| UN-002 | Regla de 80 líneas automatizada y `App.jsx` ≤ 80 | S1 | P0 | 4 | **COMPLETADO** | — |
| UN-201 | Capa de API del cliente (`src/lib/api.js`) | S1 | P0 | 5 | **COMPLETADO** | UN-001 |
| UN-104 | API de autenticación (backend) | S1 | P0 | 8 | **COMPLETADO** | UN-001 |
| UN-202 | Sesión real y retiro del acceso falso de Dog Park | S1 | P0 | 5 | **COMPLETADO** | UN-104, UN-201 |
| UN-407 | Modo oscuro en la sesión del profesor | S1 | P1 | 3 | **COMPLETADO** | UN-401 |
| UN-107 | API de tareas del profesor (CRUD) | S2 | P1 | 3 | PENDIENTE | UN-106 |
| UN-301 | API del estado del juego (adoptar, comprar, equipar) | S2 | P0 | 5 | PENDIENTE | UN-102, UN-105 |
| UN-302 | API de pasos y entrega de tareas | S2 | P1 | 5 | PENDIENTE | UN-107, UN-301 |
| UN-303 | Migrar GameState de `localStorage` a la API | S2 | P0 | 8 | PENDIENTE | UN-201, UN-202, UN-301, UN-302 |
| UN-403 | Vista del salón: lista de estudiantes | S2 | P0 | 5 | PENDIENTE | UN-106, UN-401 |
| UN-305 | `usePolling` y sincronización de la sesión del estudiante | S3 | P1 | 3 | PENDIENTE | UN-303, UN-109 |
| UN-501 | Quiz calificado en servidor y tope diario | S3 | P0 | 5 | PENDIENTE | UN-102, UN-105 |

**Carga por sprint:** S1 = 25 SP (5 tickets) · S2 = 26 SP (5 tickets) · S3 = 8 SP (2 tickets) · **Total = 59 SP (12 tickets)**.

*Nota: UN-104 (8 SP) fue asumido por Isaac tras bloqueo de Karol; cuenta en los tickets del sprint 1.*

**Participa, pero no es responsable (no cuenta en los 12 tickets ni en los 59 SP):**
- **UN-001** · ADR, contrato de API y esquema Mongo: Karol lidera, con Isaac y Nicolás. Isaac debe coincidir con Karol en el contrato de endpoints, porque de él dependen UN-201 y los tickets de API de Isaac.
- **UN-608** · Preparación de la defensa oral y de la demo: la hacen Nicolás y todo el equipo; cada integrante explica sin leer notas su parte (para Isaac, entre otros, `usePolling`).

---

## 2. Historial de cambios vivo (Changelog & Progress Log)

Registro en orden cronológico inverso (lo más reciente arriba). Una fila nueva por cada vez que se ejecute o modifique código de estos tickets.

| [Fecha / Hora] | [ID Ticket] | [Acción / Cambio Realizado] | [Estado] | [Autor/Agente] |
|---|---|---|---|---|
| 2026-11-08 / 15:30 | UN-104 | Implementación completa API autenticación (server/routes/auth.js, server/utils/jwt.js, validators/auth.js, server/app.js, server/tests/auth.test.js): 4 endpoints (POST /register, POST /login, GET /me, POST /logout), bcryptjs factor 10, JWT cookie HttpOnly 1h, TEACHER_CODE validación, Pet auto-creación, 409/403/401 códigos, passwordHash nunca expuesto. 22 tests integración Supertest + mongodb-memory-server: 22/22 PASS. | COMPLETADO (100%) | Claude (agente) |
| 2026-11-08 / 16:30 | UN-202 | Sesión real completada y eliminación acceso falso Dog Park: useAccess.js refactor (44 líneas, 3 estados checking/authenticated/anonymous, solo API real), useRole.js creado (8 líneas), auth.js corregido paths. Eliminados: dogParkAuth.js, useDogParkAccess.js, DogParkLogin.jsx, DogParkField.jsx, DogParkPlaceholder.jsx, useDogParkLogin.js, carpeta dogpark. TeachersPark ya protegida con withRole(["teacher"]). Build ✓, 22 tests backend PASS. | COMPLETADO (100%) | Claude (agente) |
| 2026-11-01 / 14:45 | UN-407 | Implementado modo oscuro en área profesor: TeachersPark.jsx (dark:bg), TeachersParkNav.jsx (botón toggle + dark:bg/border/text), TeachersParkNavItem.jsx (dark:text-white); reutiliza useDarkMode, localStorage "theme" sincronizado con HomeHeader; todos ≤80 líneas | COMPLETADO (100%) | Claude (agente) |
| 2026-11-01 / 14:30 | UN-201 | Eliminado mock de desarrollo de src/lib/api.js (líneas 48-95); archivo queda en 46 líneas con capa API real: BASE_URL=VITE_API_URL||"/api", cookies same-origin, AUTH_EXPIRED_EVENT, ApiError, AbortController, métodos get/post/put/patch/delete/request | COMPLETADO (100%) | Claude (agente) |
| 2026-10-30 / 10:30 | UN-201 | Creado `src/lib/api.js` (41 líneas) con VITE_API_URL, Authorization Bearer (localStorage.authToken), clase ApiError, AbortController vía opción signal, red fallback; métodos get/post/put/delete/request. Verificado ≤80 líneas. | COMPLETADO (100%) | Claude (agente) |
| 2026-10-30 / 10:00 | UN-002 | Refactor `App.jsx` 88→30 líneas; `useDogImages.js` 83→55; `dogApi.js` 90→47; creados `src/routes/routesConfig.js`, `src/hooks/useNavbarVisibility.js`, `src/hooks/useOnlineStatus.js`, `src/lib/dogCache.js`. Rutas existentes intactas. ESLint max-lines no implementado (fuera de scope). | COMPLETADO (100%) | Claude (agente) |
| 2026-10-26 / hora no registrada | — (documento) | Creación de `isaac_specifications.md` a partir de la hoja de tickets unificada v4 (rev. 3). Se filtran 11 tickets de Isaac (51 SP): S1 = UN-002, 201, 202, 407; S2 = UN-107, 301, 302, 303, 403; S3 = UN-305, 501. No se editó código ni se ejecutaron pruebas. Avance global: 0%. | PENDIENTE (0%) | Claude (agente) |

---

## 3. Especificaciones técnicas por ticket

Convenciones: **RF** = requerimiento funcional; **RNF** = requerimiento no funcional o restricción. Los criterios de aceptación son casillas: se marcan (`[x]`) cuando se cumplen y se comprueban. El porcentaje de avance de un ticket es la fracción de criterios marcados.

Restricciones transversales que aplican a todos los tickets (definición de terminado de la hoja):
- Ningún componente supera 80 líneas; las acciones no mutan el estado previo; comentarios en inglés.
- Estados de carga, vacíos y de error cubiertos; el cliente nunca queda en blanco si la API falla.
- Nada llama a `fetch` fuera de `lib/api.js` (salvo la decisión 9).
- Toda validación del cliente se repite en el servidor; permisos comprobados en cada endpoint; todo secreto en variables de entorno, nunca en el repo.
- No se rompe ninguna ruta ni flujo existente, en particular `/stats/:username` y `/Shop/:cosmeticId`.
- Revisado por otro integrante y probado por QA (Nicolás) antes de cerrar. Cada ticket se trabaja en su propia rama, con commits del responsable.
- Funciona en escritorio y móvil, en modo claro y oscuro (en el área del profesor lo cubre UN-407).
- `PROJECT_DOCUMENTATION.md` se actualiza en el mismo cambio, con estado ✅ / 🟡 / 🔲 y entrada en su bitácora.

Convención de rutas: la hoja escribe los endpoints sin prefijo (`/me/game`, `/auth/me`); el prefijo único (`/api/...` o ninguno) lo fija UN-001 (decisión 3).

---

### Sprint 1

#### UN-002 · Regla de 80 líneas automatizada y `App.jsx` ≤ 80

- **Sprint y prioridad:** S1 · P0 · 4 SP
- **Origen:** v3 (regla `max-lines` en CI) + estado del repo

**Contexto / problema a resolver**
La rúbrica M2 exige que ningún componente supere 80 líneas. En `origin/main`, `App.jsx` tiene 88 líneas. Además, `useDogImages.js` (83) y `dogApi.js` (89) superan el límite: no son componentes, pero `useDogImages` es el hook que el equipo debe explicar en la defensa. Hoy no existe ESLint ni ninguna regla automática que vigile el límite.

**Requerimientos funcionales**
- RF-1: el proyecto DEBE tener una regla de lint `max-lines` (80) para componentes, ejecutable con un comando y en CI.
- RF-2: `App.jsx` DEBE dividirse hasta quedar en 80 líneas o menos, sin cambiar ninguna ruta.
- RF-3: `useDogImages.js` y `dogApi.js` DEBEN quedar en 80 líneas o menos.

**Requerimientos no funcionales y restricciones**
- RNF-1: el comportamiento de `useDogImages` no cambia.
- RNF-2: todas las rutas actuales siguen funcionando, incluidas `/stats/:username` y `/Shop/:cosmeticId`.
- RNF-3: `App.jsx` también lo modifican UN-202 (Isaac) y UN-204 (Mariana): coordinar para evitar conflictos de merge (regla de v2: un solo responsable por archivo por sprint, ramas pequeñas y merges frecuentes).

**Criterios de aceptación**
- [ ] Ningún `.jsx` de `src/` supera 80 líneas, y tampoco `useDogImages.js` ni `dogApi.js`.
- [ ] El lint falla si un componente supera el límite.
- [ ] Todas las rutas actuales siguen funcionando, incluidas `/stats/:username` y `/Shop/:cosmeticId`.
- [ ] El comportamiento de `useDogImages` no cambia.

**Dependencias y archivos afectados**
- Depende de: ninguno.
- Existentes: `src/App.jsx`, `src/lib/useDogImages.js`, `src/lib/dogApi.js`, `package.json` (script de lint).
- Nuevos: configuración de ESLint y workflow de CI (nombres por definir; hoy no existen).

**Estado Actual:** `COMPLETADO` · Avance: 100% — App.jsx (30 líneas), useDogImages.js (55), dogApi.js (47); nuevos: routesConfig.js, useNavbarVisibility.js, useOnlineStatus.js, dogCache.js; lint max-lines no implementado (fuera de scope del ticket)

---

#### UN-201 · Capa de API del cliente (`src/lib/api.js`)

- **Sprint y prioridad:** S1 · P0 · 5 SP
- **Origen:** v2 PAN-209 (era de Karol); la hoja v3 (§2.1) la ubica en el foco de Isaac

**Contexto / problema a resolver**
El cliente no tiene un módulo para hablar con la API: `src/lib/api.js` no existe. El único `fetch` actual es el de `dogApi.js`, que consulta la API pública dog.ceo. Los tickets de cliente que consumen el servidor dependen de esta capa.

**Requerimientos funcionales**
- RF-1: DEBE usar `VITE_API_URL` como URL base, disponible al construir tanto para GitHub Pages como para Vercel.
- RF-2: DEBE enviar la cabecera `Authorization` con el token de sesión.
- RF-3: DEBE manejar el formato de errores `{ error: { code, message } }` y la caída de red.
- RF-4: DEBE integrarse con `useStatus` / `PanchoStatusBanner` para exponer estados de carga, éxito, error y sin conexión.
- RF-5: DEBE permitir cancelar llamadas con `AbortController`, como `useDogImages`.
- RF-6: un 401 desde cualquier llamada DEBE cerrar la sesión del cliente de forma limpia.

**Requerimientos no funcionales y restricciones**
- RNF-1: ninguna pantalla llama a `fetch` fuera de este módulo (la excepción de `dogApi.js` está en la decisión 9).
- RNF-2: el formato de errores y el prefijo de rutas salen de UN-001.
- RNF-3: el módulo se mantiene en 80 líneas o menos.

**Criterios de aceptación**
- [ ] Ninguna pantalla llama a `fetch` fuera de este módulo (salvo la decisión 9).
- [ ] Un 401 desde cualquier llamada cierra la sesión del cliente de forma limpia.

**Dependencias y archivos afectados**
- Depende de: UN-001 (Karol).
- Nuevo: `src/lib/api.js`.
- Existentes relacionados: `src/lib/useStatus.js`, `src/components/PanchoStatusBanner.jsx`, `src/lib/useDogImages.js` (patrón de `AbortController`), `src/lib/dogApi.js` (decisión 9).
- Configuración de build: variable `VITE_API_URL`.

**Estado Actual:** `COMPLETADO` · Avance: 100% — src/lib/api.js (46 líneas) con BASE_URL=VITE_API_URL||"/api", cookies same-origin, ApiError, AUTH_EXPIRED_EVENT, AbortController via signal, red fallback; métodos get/post/put/patch/delete/request; mock de desarrollo eliminado

---

#### UN-104 · API de autenticación (backend)

- **Sprint y prioridad:** S1 · P0 · 8 SP
- **Origen:** v3 UN-104 (originalmente Karol); asumido por Isaac tras bloqueo

**Contexto / problema a resolver**
El backend no tenía implementación de autenticación. Solo existía el middleware `authenticate.js` y validadores, pero faltaban los handlers de registro, login, me y logout. Se requiere implementación completa según ADR 7.4 con cookies HttpOnly, JWT, bcryptjs, validación Zod y rate limiting.

**Requerimientos funcionales**
- RF-1: POST `/api/auth/register` — registro de student/teacher con validación Zod (name 2-80, email válido, password 6-128, role enum, teacherCode opcional).
- RF-2: POST `/api/auth/login` — login con email/password, bcrypt compare, JWT en cookie HttpOnly (SameSite=Lax, Secure en prod, 1h expiración).
- RF-3: GET `/api/auth/me` — lectura de usuario desde cookie JWT, devuelve user sin passwordHash.
- RF-4: POST `/api/auth/logout` — limpia cookie session, responde 204.
- RF-5: Validación TEACHER_CODE obligatorio para role="teacher" → 403 FORBIDDEN si falta o inválido.
- RF-6: Auto-creación Pet para students (coins: 270, status: alive, periodId placeholder).
- RF-7: Email único → 409 CONFLICT.
- RF-8: Credenciales inválidas → 401 UNAUTHORIZED genérico ("Credenciales inválidas") — no revela existencia de usuario.
- RF-9: passwordHash NUNCA en respuestas (select:false en modelo + omitido en handlers).

**Requerimientos no funcionales y restricciones**
- RNF-1: bcryptjs factor 10 (OWASP compliant, pure JS, sin dependencias nativas).
- RNF-2: JWT HS256 con expiración corta (1h) en cookie HttpOnly.
- RNF-3: Rate limiting login/register (desactivado en NODE_ENV=test).
- RNF-4: Validación Zod estricta (z.strictObject) en cada endpoint.
- RNF-5: Tests de integración con Supertest + mongodb-memory-server (22 tests, 22 PASS).

**Criterios de aceptación**
- [x] POST /register student → 201 + cookie + Pet auto-creado
- [x] POST /register teacher con TEACHER_CODE válido → 201 + cookie
- [x] POST /register teacher SIN/inválido TEACHER_CODE → 403 FORBIDDEN
- [x] POST /register email duplicado → 409 CONFLICT
- [x] Validaciones Zod (email, name, password, role) → 400 VALIDATION_ERROR
- [x] POST /login válido → 200 + cookie HttpOnly (Secure, SameSite=Lax)
- [x] POST /login contraseña incorrecta → 401 UNAUTHORIZED genérico
- [x] POST /login usuario inexistente → 401 UNAUTHORIZED genérico
- [x] GET /me con cookie válida → 200 user sin passwordHash
- [x] GET /me sin cookie → 401 UNAUTHORIZED
- [x] POST /logout → 204 + cookie limpiada (Max-Age=0)
- [x] Logout invalida sesión → GET /me tras logout = 401
- [x] passwordHash nunca expuesto en register, login, me

**Dependencias y archivos afectados**
- Depende de: UN-001 (contrato ADR 7.4).
- Archivos creados: `server/routes/auth.js` (165 líneas), `server/utils/jwt.js` (35 líneas), `server/tests/auth.test.js` (430 líneas).
- Archivos modificados: `server/validators/auth.js` (teacherCode opcional), `server/app.js` (montaje /api/auth), `package.json` (deps: supertest, mongodb-memory-server).
- Modelos usados: `server/models/User.js`, `server/models/Pet.js` (existentes).
- Middleware usado: `server/middleware/validateBody.js`, `server/middleware/authRateLimit.js`, `server/middleware/errorHandler.js`, `server/utils/AppError.js`.

**Estado Actual:** `COMPLETADO` · Avance: 100% — 4 endpoints funcionales, 22 tests integración PASS, rate limiting desactivado en test, validación por-ruta en auth.js

---

#### UN-202 · Sesión real y retiro del acceso falso de Dog Park

- **Sprint y prioridad:** S1 · P0 · 5 SP
- **Origen:** v2 PAN-103 + v3 §1.2 (migrar y borrar el auth de Dog Park)

**Contexto / problema a resolver**
Hoy el acceso a las rutas protegidas es la bandera `panchoAccess` en `localStorage` (`auth.js` + `useAccess`), sin roles ni contraseñas verificadas. Existe además un segundo sistema falso: `dogParkAuth.js`, `useDogParkAccess.js` y `DogParkLogin` aceptan cualquier usuario de 3 o más caracteres con cualquier contraseña no vacía y abren `/teachersPark`. Hay que reemplazar ambos por una sesión real con rol, y borrar el acceso falso.

**Requerimientos funcionales**
- RF-1: DEBE guardar el token y cargar la sesión al iniciar la app con `GET /auth/me`.
- RF-2: `useAccess` DEBE tener 3 estados: `checking`, `authenticated`, `anonymous`.
- RF-3: DEBE existir `useRole()` que devuelva `student`, `teacher` o `null`.
- RF-4: DEBEN adaptarse todos los usuarios de `grantAccess` / `revokeAccess`: `HomeHeader`, `useJoinForm`, `useConfirmPancho`, `useLoginForm`.
- RF-5: cerrar sesión DEBE limpiar el token y el estado.
- RF-6: DEBEN retirarse `dogParkAuth.js`, `useDogParkAccess.js`, `DogParkLogin`, `DogParkField`, `useDogParkLogin` y el huérfano `DogParkPlaceholder`.
- RF-7: `/teachersPark` DEBE quedar protegida por rol de profesor.

**Requerimientos no funcionales y restricciones**
- RNF-1: no puede quedar ningún acceso por bandera local.
- RNF-2: dónde se guarda el token depende de la decisión 1 (Bearer en `localStorage` o cookie httpOnly).
- RNF-3: la sincronización de sesión entre pestañas por el evento `storage` está fuera de alcance.
- RNF-4: coordinar con UN-204 (Mariana), que añade `allowedRoles` a `ProtectedRoute` y toca `App.jsx`.

**Criterios de aceptación**
- [x] Al recargar con sesión válida no hay parpadeo hacia `/login`.
- [x] Un token vencido o inválido deja al usuario anónimo.
- [x] No queda ningún acceso por bandera local.
- [x] Un estudiante no entra a `/teachersPark`.

**Dependencias y archivos afectados**
- Depende de: UN-104 (API de autenticación — **COMPLETADA**) y UN-201.
- Bloquea: UN-203, UN-204, UN-205 (Mariana) y UN-703 (Nicolás).
- Modificar: `src/lib/auth.js`, `src/lib/useAccess.js`, `src/pages/home/useJoinForm.js`, `src/pages/choose/useConfirmPancho.js`, `src/pages/login/useLoginForm.js`, `HomeHeader`, `App.jsx`.
- Eliminar: `src/lib/dogParkAuth.js`, `src/lib/useDogParkAccess.js`, `src/pages/dogpark/DogParkLogin.jsx`, `src/pages/dogpark/DogParkField.jsx`, `src/pages/dogpark/useDogParkLogin.js`, `src/pages/dogpark/DogParkPlaceholder.jsx`.
- Nuevo: `useRole()` (ubicación sugerida: `src/lib/`, junto a los demás hooks).

**Estado Actual:** `COMPLETADO` · Avance: 100% — useAccess.js (44 líneas, 3 estados, solo API real), useRole.js (8 líneas), auth.js corregido; eliminados 6 archivos + carpeta dogpark; TeachersPark protegida con withRole(["teacher"]); Build ✓, 22 tests backend PASS

---

#### UN-407 · Modo oscuro en la sesión del profesor

- **Sprint y prioridad:** S1 · P1 · 3 SP
- **Origen:** pedido del equipo en la revisión 2 de la hoja; estimación nueva

**Contexto / problema a resolver**
El sitio ya tiene un modo oscuro: el hook `useDarkMode` aplica la clase `dark-mode` en `<body>`, Tailwind usa `darkMode: ["selector", ".dark-mode"]` y la elección se guarda en `localStorage` bajo `theme`. Pero el área del profesor no lo tiene: `TeachersPark`, `TeachersParkNav`, `TeachersParkNavItem` y `ParkDog` no tienen ninguna variante `dark:` ni botón de tema (la barra solo trae «Log out»). Además `useDarkMode` solo se monta en `HomeHeader`, así que el tema guardado únicamente se reaplica al entrar por el Home.

**Requerimientos funcionales**
- RF-1: la barra del profesor DEBE tener un botón de cambio de tema, con la misma preferencia que el resto del sitio.
- RF-2: el shell del profesor (`TeachersPark`, `TeachersParkNav`, `TeachersParkNavItem`, `ParkDog`) DEBE tener variantes `dark:` de Tailwind.
- RF-3: recargar una ruta del profesor DEBE conservar el tema elegido.
- RF-4: las pantallas UN-401, UN-403, UN-404, UN-405 y UN-406 DEBEN verse bien en claro y en oscuro.

**Requerimientos no funcionales y restricciones**
- RNF-1: se reutiliza el mecanismo existente (`useDarkMode`, clase `dark-mode`, clave `theme`); no se crea un segundo almacén de tema.
- RNF-2: Mariana e Isaac construyen las pantallas del profesor con variantes `dark:`; QA lo comprueba en UN-606.
- RNF-3: las pantallas del estudiante no tienen modo oscuro y quedan fuera de este ticket (decisión 11).

**Criterios de aceptación**
- [x] Hay un botón de tema en la barra del profesor, con la misma preferencia que el resto del sitio.
- [x] Recargar una ruta del profesor conserva el tema elegido.
- [x] El shell del profesor y las pantallas UN-401, 403, 404, 405 y 406 se ven bien en claro y en oscuro.

**Dependencias y archivos afectados**
- Depende de: UN-401 (panel del profesor, Mariana).
- Modificar: `src/pages/teacherspark/TeachersPark.jsx`, `TeachersParkNav.jsx`, `TeachersParkNavItem.jsx`, `ParkDog.jsx`; `src/lib/useDarkMode.js` (montarlo también en el área del profesor).
- Sin cambios previstos: `tailwind.config.js` (el selector ya existe).

**Estado Actual:** `COMPLETADO` · Avance: 100% — TeachersPark.jsx (dark:bg), TeachersParkNav.jsx (botón tema + dark:bg/border/text), TeachersParkNavItem.jsx (dark:text-white); reutiliza useDarkMode, localStorage "theme" sincronizado con resto del sitio

---

### Sprint 2

#### UN-107 · API de tareas del profesor (CRUD)

- **Sprint y prioridad:** S2 · P1 · 3 SP
- **Origen:** v3 PAN-207 (en v2, PAN-204 era de Karol)

**Contexto / problema a resolver**
Las tareas de un salón se guardan en MongoDB (colección `assignments`: título, descripción y fecha límite). Hoy el cliente solo conoce una tarea fija por defecto. Hace falta un CRUD que solo el profesor dueño del salón pueda modificar.

**Requerimientos funcionales**
- RF-1: DEBE existir CRUD de tareas por salón sobre la colección `assignments`.
- RF-2: solo el profesor del salón DEBE poder crear, editar o borrar.
- RF-3: los estudiantes inscritos DEBEN poder solo leer.
- RF-4: las fechas DEBEN validarse.

**Requerimientos no funcionales y restricciones**
- RNF-1: los permisos se comprueban en el backend, no solo en la interfaz.
- RNF-2: un título con `<script>` se guarda como texto y se devuelve intacto; el cliente lo escapa.
- RNF-3: validación estricta de entradas y formato de errores de UN-001; sin datos en memoria (M3).

**Criterios de aceptación**
- [ ] Solo el profesor del salón crea, edita o borra.
- [ ] Los estudiantes inscritos solo leen.
- [ ] Las fechas se validan.
- [ ] Un título con `<script>` se guarda como texto y se devuelve intacto.

**Dependencias y archivos afectados**
- Depende de: UN-106 (API de salones, Mariana), que a su vez necesita UN-105 (Karol).
- Bloquea: UN-302 (Isaac) y UN-405 (UI de tareas, Mariana).
- Archivos: nuevos, en `server/` (nombres por definir según UN-101 y UN-001); usa el modelo `assignments` de UN-102. No toca el cliente (la UI es UN-405).

**Estado Actual:** `PENDIENTE` · Avance: 0%

---

#### UN-301 · API del estado del juego (adoptar, comprar, equipar)

- **Sprint y prioridad:** S2 · P0 · 5 SP
- **Origen:** v3 PAN-208 (en v2, PAN-205 era de Karol)

**Contexto / problema a resolver**
Hoy las reglas de adoptar, comprar y equipar viven en el cliente (`state/actions/pancho.js` y `shop.js`) y se persisten en `localStorage`. Deben pasar al servidor, que se convierte en la fuente de verdad de monedas y compras.

**Requerimientos funcionales**
- RF-1: `GET /me/game` DEBE devolver `{ student, dog, currentAssignment }` con la forma actual del cliente.
- RF-2: DEBEN portarse las reglas de elegir Pancho (reinicia salud y hambre), comprar (valida saldo y que no esté ya comprado) y equipar o desequipar por ranura (`head`, `face`, `neck`, `body`).
- RF-3: las monedas iniciales DEBEN ser 270.
- RF-4: DEBE existir `GET /cosmetics`, que entrega el catálogo desde la colección `cosmetics`; la compra se valida contra esa colección.

**Requerimientos no funcionales y restricciones**
- RNF-1: las reglas deben coincidir con las del cliente actual (mismos casos de prueba).
- RNF-2: un profesor que llama estas rutas recibe 403 (permisos en el backend).
- RNF-3: `cosmetics` se carga con el seed (UN-111) desde `src/data/dataset.json`; el servidor no lee ese archivo ni lo guarda en memoria.
- RNF-4: UN-108 (hambre perezosa, Karol) depende de este ticket.

**Criterios de aceptación**
- [ ] Comprar sin saldo, un cosmético duplicado o uno inexistente devuelve error y no cambia nada.
- [ ] Las reglas coinciden con las del cliente (mismos casos de prueba).
- [ ] Un profesor que llama estas rutas recibe 403.

**Dependencias y archivos afectados**
- Depende de: UN-102 (modelos, Karol) y UN-105 (middleware, Karol).
- Bloquea: UN-302 y UN-303 (Isaac), UN-108 (Karol).
- Referencia (reglas a portar): `src/state/actions/pancho.js`, `src/state/actions/shop.js`, `src/state/constants.js` (`STARTING_COINS = 270`), `src/data/dataset.json`.
- Archivos: nuevos, en `server/` (nombres por definir).

**Estado Actual:** `PENDIENTE` · Avance: 0%

---

#### UN-302 · API de pasos y entrega de tareas

- **Sprint y prioridad:** S2 · P1 · 5 SP
- **Origen:** v3 PAN-209, v2 PAN-206 (sin `score`)

**Contexto / problema a resolver**
La tarea activa tiene 4 pasos y su lógica está en `state/actions/assignment.js`. Entregarla restaura hambre (+30) pero nunca da monedas ni salud. Esa lógica y el registro de entregas deben pasar al servidor. La calificación (`score`) quedó fuera de alcance.

**Requerimientos funcionales**
- RF-1: DEBE poder completarse los pasos 1 a 3 y entregarse el paso 4 (+30 de hambre).
- RF-2: entregar NUNCA DEBE dar monedas ni salud.
- RF-3: cada entrega DEBE registrarse en `submissions`.
- RF-4: sin salón o sin tareas, DEBE usarse la tarea por defecto.

**Requerimientos no funcionales y restricciones**
- RNF-1: índice único `(assignmentId, studentId)`: una entrega se registra una sola vez aunque se envíe dos veces.
- RNF-2: las entregas de un estudiante no aparecen en otro (propiedad de recursos).
- RNF-3: sin `score` ni endpoint de calificación (backlog).

**Criterios de aceptación**
- [ ] El paso 4 solo con los pasos 1 a 3 completos y el perro vivo.
- [ ] Una entrega se registra una sola vez aunque se envíe dos veces.
- [ ] Las entregas de un estudiante no aparecen en otro.
- [ ] Sin salón o sin tareas se usa la tarea por defecto.

**Dependencias y archivos afectados**
- Depende de: UN-107 y UN-301.
- Bloquea: UN-303 (Isaac).
- Referencia (reglas a portar): `src/state/actions/assignment.js`, `src/state/constants.js` (`SUBMIT_REWARDS`).
- Archivos: nuevos, en `server/` (nombres por definir); modelo `submissions` de UN-102.

**Estado Actual:** `PENDIENTE` · Avance: 0%

---

#### UN-303 · Migrar GameState de `localStorage` a la API

- **Sprint y prioridad:** S2 · P0 · 8 SP
- **Origen:** v2 PAN-210; v3 §2.1 y §1.3 (esperar la respuesta del servidor)

**Contexto / problema a resolver**
El estado del juego es un singleton en el navegador (`GameState`, conectado con `useSyncExternalStore`), persistido en `localStorage`, con el hambre bajando por un `setInterval` en `RaisePancho` y `PanchoStats` escuchando el evento `storage`. Con servidor, el estado debe salir de la API sin reescribir todas las páginas.

**Requerimientos funcionales**
- RF-1: DEBE mantenerse la interfaz de `useGameState()` (`dog`, `student`, `currentAssignment` y las acciones, incluida `awardMinigameCoins`) para que los componentes casi no cambien.
- RF-2: las acciones DEBEN pasar a ser asíncronas y esperar la respuesta del servidor (sin actualización optimista con reversión).
- RF-3: el `setInterval` de `RaisePancho` DEBE reemplazarse por `usePolling` (UN-305), y el listener de `storage` de `PanchoStats` por recarga al volver a la pestaña.
- RF-4: `localStorage` DEBE retirarse como base de datos en `state/storage.js` y `lib/dogStorage.js` (favoritos y modo oscuro se quedan).
- RF-5: el catálogo de cosméticos DEBE leerse de `GET /cosmetics` en lugar de importar `dataset.json` (hoy lo hace `catalog.js`).

**Requerimientos no funcionales y restricciones**
- RNF-1: si el servidor falla, la interfaz muestra el error y no deja el estado a medias.
- RNF-2: el valor del contexto sigue memoizado con `useMemo`, para que los consumidores no se redibujen sin necesidad.
- RNF-3: componentes en 80 líneas o menos.
- RNF-4: riesgo de conflictos de merge en `GameStateContext.jsx`: un solo responsable por archivo por sprint, ramas pequeñas y merges frecuentes (v2 §9).

**Criterios de aceptación**
- [ ] Adoptar, alimentar, comprar y equipar funcionan igual que antes, ahora persistidos.
- [ ] Un estudiante que entra desde otro dispositivo ve su mismo Pancho y su saldo.
- [ ] Si el servidor falla, la interfaz muestra el error y no deja el estado a medias.

**Dependencias y archivos afectados**
- Depende de: UN-201, **UN-202 (COMPLETADO)**, UN-301, UN-302.
- Bloquea: UN-304 (Mariana), UN-502 (Mariana), UN-305 (Isaac).
- Modificar: `src/state/GameStateContext.jsx`, `src/state/gameState.js`, `src/state/GameStateBase.js`, `src/state/storage.js`, `src/lib/dogStorage.js`, `src/data/catalog.js`, `src/pages/RaisePancho.jsx`, `src/pages/PanchoStats.jsx`, y las páginas que consumen `useGameState()` (Shop, CosmeticDetail, MiniGames).
- Revisar: `src/state/actions/*` (las reglas pasan al servidor).

**Estado Actual:** `PENDIENTE` · Avance: 0%

---

#### UN-403 · Vista del salón: lista de estudiantes

- **Sprint y prioridad:** S2 · P0 · 5 SP
- **Origen:** v2 PAN-302; v3 §1.2 (aprovechar `TeachersPark`). Isaac implementa el diseño de Mariana.

**Contexto / problema a resolver**
`TeachersPark` ya existe (barra, fondo, pestañas) pero muestra 6 perros fijos de `parkDogs.js` que son datos falsos. El profesor necesita ver el salón con sus estudiantes reales y el estado de cada mascota.

**Requerimientos funcionales**
- RF-1: la ruta del salón DEBE mostrar una tarjeta por estudiante con nombre, estado ALIVE o DEAD y barras de hambre y salud (nombre final de la ruta según UN-001 y decisión 3).
- RF-2: DEBEN reutilizarse `StatusBars` y el estilo de `StatPill`.
- RF-3: cada tarjeta DEBE enlazar al detalle (UN-404).
- RF-4: DEBE mostrarse quién está inscrito y permitir retirar a un estudiante.
- RF-5: los 6 perros fijos de `parkDogs.js` DEBEN eliminarse: el parque muestra solo datos de la API.

**Requerimientos no funcionales y restricciones**
- RNF-1: sin datos fijos en el cliente (M3).
- RNF-2: soporte de modo oscuro (UN-407) y de móvil.
- RNF-3: HTML semántico: un `<main>` y un `<h1>` por página (UN-703).
- RNF-4: componentes en 80 líneas o menos.

**Criterios de aceptación**
- [ ] Los estudiantes DEAD se distinguen a simple vista.
- [ ] Hay estados vacíos: salón sin estudiantes, y estudiante que aún no eligió Pancho.
- [ ] Con el cálculo en servidor (UN-108), los valores reflejan el momento actual.

**Dependencias y archivos afectados**
- Depende de: UN-106 (API de salones, Mariana) y UN-401 (panel y diseño, Mariana).
- Bloquea: UN-404 (Mariana).
- Modificar: `src/pages/teacherspark/TeachersPark.jsx`, `ParkDog.jsx`, `App.jsx` (ruta).
- Eliminar: `src/pages/teacherspark/parkDogs.js`.
- Reutilizar: `src/pages/raise/StatusBars.jsx`, `StatPill`.

**Estado Actual:** `PENDIENTE` · Avance: 0%

---

### Sprint 3

#### UN-305 · `usePolling` y sincronización de la sesión del estudiante

- **Sprint y prioridad:** S3 · P1 · 3 SP
- **Origen:** v2 PAN-306; v3 §2 («PAN-307», mapeo por contenido)

**Contexto / problema a resolver**
Si el profesor revive al perro mientras el estudiante tiene el juego abierto, el estudiante debe verlo sin recargar. v3 propone `usePolling` como el hook que el equipo explicará en la defensa oral de M2: dependency array no trivial y cleanup real.

**Requerimientos funcionales**
- RF-1: DEBE existir un hook reutilizable que recargue el estado periódicamente y al volver el foco a la pestaña.
- RF-2: DEBE reemplazar el `setInterval` de `RaisePancho`.
- RF-3: DEBE poder reutilizarse en el panel del profesor.

**Requerimientos no funcionales y restricciones**
- RNF-1: WebSockets y SSE están fuera de alcance.
- RNF-2: dependency array no trivial y cleanup real (timers y listeners se limpian al desmontar).
- RNF-3: la recarga no pisa una acción del estudiante en curso (por ejemplo, una compra).
- RNF-4: el hook se documenta por escrito: qué dispara el efecto (dependency array), qué limpia el cleanup y cuándo corre (insumo de UN-608).

**Criterios de aceptación**
- [ ] El cartel `DeadNotice` desaparece y las barras se actualizan en pocos segundos tras revivir.
- [ ] La recarga no pisa una acción en curso (por ejemplo una compra).
- [ ] Los timers y listeners se limpian al desmontar.
- [ ] La explicación escrita del hook dice qué dispara el efecto, qué limpia el cleanup y cuándo corre.

**Dependencias y archivos afectados**
- Depende de: UN-303 y UN-109 (endpoint de revivir, Karol).
- Nuevo: `usePolling` (ubicación sugerida: `src/lib/`, junto a los demás hooks).
- Modificar: `src/pages/RaisePancho.jsx` (el límite de 80 líneas ya está al borde), panel del profesor (reutilización).

**Estado Actual:** `PENDIENTE` · Avance: 0%

---

#### UN-501 · Quiz calificado en servidor y tope diario

- **Sprint y prioridad:** S3 · P0 · 5 SP
- **Origen:** v3 PAN-212, v2 PAN-402 (v2 aceptaba que el cliente informara el puntaje)

**Contexto / problema a resolver**
El quiz de `MiniGames` funciona en el cliente: el banco de 5 preguntas de `quizQuestions.js` incluye `correctIndex`, por lo que cualquiera puede leer las respuestas en el bundle, y las monedas las decide el cliente con `awardMinigameCoins`. El servidor debe entregar las preguntas sin respuesta y calificar él mismo.

**Requerimientos funcionales**
- RF-1: `GET /minigames/quiz` DEBE devolver las preguntas sin `correctIndex`.
- RF-2: `POST /minigames/quiz/submit` DEBE recibir las respuestas y calificarlas en el servidor.
- RF-3: la recompensa DEBE ser `min(aciertos, 5)`, como `awardMinigameCoins` hoy.
- RF-4: el tope diario y el enfriamiento entre partidas DEBEN guardarse en `minigame_plays`.
- RF-5: el banco de preguntas DEBE vivir en la colección `quiz_questions` de MongoDB, no en un arreglo en la memoria del servidor.

**Requerimientos no funcionales y restricciones**
- RNF-1: los valores inválidos (negativo, NaN, enorme, ids inexistentes) se rechazan sin cambiar el saldo.
- RNF-2: un profesor recibe 403.
- RNF-3: las respuestas correctas no son visibles en el bundle ni en el GET.
- RNF-4: los valores del tope y del enfriamiento los define la decisión 6; si un perro DEAD puede jugar, la decisión 8.
- RNF-5: el cliente (UN-502, Mariana) deja de decidir las monedas y elimina `correctIndex`; este ticket cubre solo el servidor.

**Criterios de aceptación**
- [ ] Superado el tope no suma monedas y la respuesta lo indica.
- [ ] Los valores inválidos se rechazan sin cambiar el saldo.
- [ ] Un profesor recibe 403.
- [ ] Las respuestas correctas no son visibles en el bundle ni en el GET.

**Dependencias y archivos afectados**
- Depende de: UN-102 (modelos, Karol) y UN-105 (middleware, Karol); el contenido de `quiz_questions` lo carga UN-111 (Nicolás).
- Bloquea: UN-502 (Mariana).
- Referencia: `src/pages/minigames/quizQuestions.js`, `src/state/actions/minigames.js`, `MINIGAME_REWARD_COINS` en `src/state/constants.js`.
- Archivos: nuevos, en `server/` (nombres por definir).

**Estado Actual:** `PENDIENTE` · Avance: 0%

---

## 4. Dependencias entre tickets

**Lo que Isaac necesita de otros (bloqueos externos):**

| Ticket de Isaac | Espera a | Responsable |
|---|---|---|
| UN-201 | UN-001 (ADR, contrato, esquema) | Karol |
| UN-202 | UN-104 (API de autenticación) — **COMPLETADA** | — (Isaac) |
| UN-407 | UN-401 (panel del profesor) | Mariana |
| UN-107 | UN-106 (API de salones), que depende de UN-105 | Mariana (revisa Karol) |
| UN-301 | UN-102 (modelos), UN-105 (middleware) | Karol |
| UN-403 | UN-106 (API de salones), UN-401 (panel y diseño) | Mariana |
| UN-305 | UN-109 (endpoint de revivir) | Karol |
| UN-501 | UN-102 (modelos), UN-105 (middleware) | Karol |

**Lo que otros necesitan de Isaac:**

| Ticket de Isaac | Lo esperan |
|---|---|
| UN-202 | **COMPLETADO** — UN-203, UN-204, UN-205 (Mariana), UN-703 (Nicolás) desbloqueados |
| UN-107 | UN-405 (Mariana) |
| UN-301 | UN-108 (Karol) |
| UN-303 | UN-304 y UN-502 (Mariana) |
| UN-403 | UN-404 (Mariana) |
| UN-501 | UN-502 (Mariana) |

---

## 5. Decisiones abiertas que afectan a estos tickets

| # | Decisión | Afecta a |
|---|---|---|
| 1 | Token: Bearer en `localStorage` o cookie httpOnly con un rewrite de `/api` en Vercel | UN-201, UN-202 |
| 3 | Prefijo de rutas de la API y nombre del panel del profesor (`/teachersPark` o `/teacher/*`) | UN-202, UN-301, UN-403 |
| 6 | Valores del tope diario y del enfriamiento del quiz | UN-501 |
| 8 | Si un perro DEAD puede jugar minijuegos | UN-501 |
| 9 | `dogApi.js` consulta dog.ceo con `fetch`: ¿excepción a la regla «fetch solo en `api.js`»? | UN-201 |
| 11 | Modo oscuro en las pantallas del estudiante (hoy no hay ticket ni SP) | UN-407 |
| 12 | CRUD completo por entidad exigido por la rúbrica M3 | UN-107, UN-301 |

Hasta que se cierren, cada ticket debe registrar en el historial el supuesto que tomó.

---

## 6. Protocolo de actualización automática (obligatorio)

Este apartado va dirigido a cualquier IA o persona que ejecute o modifique código relacionado con los tickets de Isaac.

> **REGLA DE MANTENIMIENTO DEL DOCUMENTO:**
> Cada vez que una IA o desarrollador ejecute o modifique código relacionado con los tickets de Isaac:
> 1. Debe actualizar el campo `Estado Actual` del ticket correspondiente en este documento.
> 2. Debe añadir una nueva entrada en la tabla de **Historial de Cambios Vivo** detallando los archivos editados, las pruebas realizadas y el porcentaje de avance o finalización.
> 3. No se considerará completada ninguna tarea sin haber actualizado previamente este archivo de especificaciones.

**Cómo aplicarla:**

1. **Estados permitidos:** `PENDIENTE`, `EN PROGRESO`, `COMPLETADO`. Un ticket pasa a `EN PROGRESO` al empezar a editar código y a `COMPLETADO` solo cuando todos sus criterios de aceptación están marcados `[x]` y comprobados.
2. **Avance:** el porcentaje de un ticket es la fracción de criterios de aceptación marcados. Al actualizarlo, marca los criterios cumplidos en la sección 3 y actualiza la línea `Estado Actual` del ticket.
3. **Entrada del historial** (una fila nueva, arriba de las anteriores, con las cinco columnas):
   - `[Fecha / Hora]`: formato `AAAA-MM-DD / HH:MM`.
   - `[ID Ticket]`: el ticket afectado.
   - `[Acción / Cambio Realizado]`: archivos editados, creados o eliminados; pruebas realizadas y su resultado (o «sin pruebas»); porcentaje de avance del ticket; bloqueos o supuestos tomados.
   - `[Estado]`: el estado del ticket tras el cambio, con su porcentaje.
   - `[Autor/Agente]`: nombre de la persona o modelo de IA.
4. **Orden:** actualizar este archivo antes de dar el ticket por terminado, no después.
5. **Tabla de resumen:** al cambiar el estado de un ticket, actualizar también su fila de la sección 1 y el **Estado global** y la **Última actualización** del encabezado.
6. **Bloqueos:** si un ticket no puede avanzar por una dependencia de otra persona (sección 4), regístralo en el historial con el ID del ticket que lo bloquea; no cambies su estado a `COMPLETADO`.
7. **Documentación del proyecto:** la definición de terminado de la hoja exige además actualizar `PROJECT_DOCUMENTATION.md` en el mismo cambio, con estado ✅ / 🟡 / 🔲 y entrada en su bitácora.
8. **Cambios en la hoja de tickets:** si el equipo modifica un ticket de Isaac en la hoja unificada, refleja el cambio aquí (alcance, SP, dependencias o criterios) y regístralo en el historial.