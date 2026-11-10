# ADR-001 — Contrato API, autenticación y modelo MongoDB

**Proyecto:** Panchoracle-v.2
**Ticket:** UN-001 · ADR, contrato de API y esquema Mongo
**Repositorio:** https://github.com/Niculazo11/Panchoracle-v.2.git
**Ubicación en el repo:** `docs/ADR-001-api-mongodb.md`
**Revisión:** 2

## 1. Estado

| Parte | Estado |
|---|---|
| Revisión 0 (decisiones D2, D4, D5, D6, D7, D8, contrato y esquema originales) | **Aceptado** — aprobado por los cuatro integrantes (sección 13) |
| Revisión 1 (`users.username` opcional) | **Pendiente de confirmar** — el código la cita como decisión del equipo (`User.js`), pero no consta en la versión 0 de este documento |
| Revisión 2 (secciones marcadas con **[Rev. 2]**) | **Propuesta — pendiente de firma** de los cuatro integrantes |

Mientras la revisión 2 no esté firmada, lo marcado como **[Rev. 2]** es una propuesta de implementación y no una decisión cerrada.

## 2. Fecha e historial de revisiones

| Rev. | Fecha | Cambios |
|---|---|---|
| 0 | 2026-10-29 | Versión original aprobada por los cuatro integrantes. |
| 1 | — | `users.username` opcional con índice único parcial (referenciada en `server/models/User.js`; fecha por confirmar). |
| 2 | 2026-11-01 | Hosting en **un único proyecto Vercel** (sección 10); política de origen en lugar de CORS (5.2); hardening de seguridad y código `429` (5.8, 7.6); `GET /api/health` pública (7.2, 7.3); cosméticos e inventario (`pets.inventory`, `pets.equipped`, colecciones `cosmetics` y `quiz_questions`, secciones 8.4, 8.7, 8.8); colección de infraestructura `rate_limits` (8.9); decisiones pendientes actualizadas (12); tabla de criterios de UN-001 (14). |

## 3. Responsables

| Integrante | Rol |
|---|---|
| Karol | Lead |
| Isaac | API / Desarrollo |
| Nicolás | MongoDB / Desarrollo |
| Mariana | UX/UI |

## 4. Contexto

Panchoracle-v.2 es una aplicación educativa gamificada. Cada estudiante tiene una mascota virtual, **Pancho**, que refleja el cumplimiento de sus tareas académicas mediante dos estadísticas independientes:

- `health` (vida), rango 0–100.
- `hunger` (hambre), rango 0–100.

El profesor administra un classroom y define las tareas del periodo académico.

El prototipo actual guarda su estado en `localStorage` y no tiene backend. Para pasar a la arquitectura definitiva (frontend + API + base de datos + almacenamiento de archivos) hay que cerrar de forma conjunta:

- el mecanismo de autenticación;
- las reglas de decaimiento de Pancho (también cuando el estudiante está offline);
- las reglas de muerte, recompensa y acceso al classroom;
- el destino de los datos locales actuales;
- el contrato REST y el esquema MongoDB.

Funcionalidades núcleo cubiertas por este ADR: registro e inicio de sesión, creación de classroom y unión mediante código, definición de tareas por el profesor, entrega de tareas, estado de Pancho (vida/hambre/monedas), minijuegos con recompensa y tienda de cosméticos.

### Decisiones cerradas por este ADR

| Id | Tema | Decisión (resumen) | Sección |
|---|---|---|---|
| D2 | Autenticación | Cookie `httpOnly`; **sin** Bearer Token | 5.2 |
| D4 | Decaimiento offline | Hambre decrece con el tiempo; vida solo baja por tarea vencida sin entrega; estado derivado de marcas de tiempo | 5.3 |
| D5 | Revivir | No existe | 5.4 |
| D6 | Recompensa | 5 coins por partida válida, fijados por el servidor | 5.5 |
| D7 | Código de profesor | `joinCode` único; lo da el profesor o lo genera el backend | 5.6 |
| D8 | Datos locales | No se migran; se descartan | 5.7 |

## 5. Decisiones

### 5.1 Stack y hosting

| Capa | Decisión |
|---|---|
| Frontend | Vercel (mismo proyecto que la API) |
| Backend (API `/api/...`) | Vercel (funciones serverless) |
| Base de datos | MongoDB Atlas |
| Archivos entregados | Cloud/Object Storage externo — **proveedor pendiente** |

Detalle en las secciones 9 y 10.

### 5.2 Autenticación — D2

**Decisión:** la sesión se mantiene con una **cookie `httpOnly`** emitida y gestionada por el backend. **No** se usa Bearer Token como mecanismo de autenticación.

- Atributos de la cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
- El frontend nunca lee ni almacena el identificador de sesión; el navegador lo envía automáticamente en cada petición a `/api/...`. El cliente HTTP usa `credentials: "same-origin"` y **no** escribe la cabecera `Authorization`.
- `POST /api/auth/login` y `POST /api/auth/register` establecen la cookie; `POST /api/auth/logout` la invalida/expira.
- El backend identifica usuario y rol exclusivamente a partir de la cookie. El cliente no envía su `userId` ni su `role` para autorizar nada.
- **[Rev. 2]** El valor de la cookie puede ser un token firmado (por ejemplo, un JWT) o un identificador de sesión guardado en MongoDB; en ambos casos **solo viaja dentro de la cookie**, nunca en `Authorization` ni en `localStorage`.

**[Rev. 2] Política de origen (en lugar de CORS).** Como frontend y API comparten origen (sección 10), la API **no emite cabeceras CORS**. Un middleware valida la cabecera `Origin`:

- sin `Origin` → se acepta;
- `Origin` igual al host de la petición (mismo origen, incluidos los POST del propio sitio) → se acepta;
- `http://localhost:*` y `http://127.0.0.1:*` → solo fuera de Vercel (desarrollo local);
- dominios propios adicionales → solo si se listan en la variable `ALLOWED_ORIGINS`;
- cualquier otro → `403 FORBIDDEN`.

Esta comprobación complementa a `SameSite=Lax` como defensa contra CSRF. `https://niculazo11.github.io` **deja de estar permitido**: el sitio ya no se publica en GitHub Pages.

**Justificación:**

- `HttpOnly` impide que JavaScript acceda a la credencial, lo que reduce el impacto de un XSS frente a guardar un token en `localStorage`/`sessionStorage`.
- Se aprovecha que frontend y `/api` se sirven bajo el mismo dominio de Vercel (mismo origen): no requiere CORS con credenciales y `SameSite=Lax` es suficiente como defensa base contra CSRF.
- El frontend no tiene que gestionar almacenamiento ni renovación de tokens.

Las contraseñas se almacenan solo como `passwordHash` (hash con sal; la implementación usa `bcryptjs`, no `bcrypt`). La duración de la sesión es un detalle de implementación (ver sección 12).

**[Rev. 2] Sesión caducada en el cliente (RF-6 de UN-201).** Cualquier `401` de una ruta distinta de `POST /api/auth/login` y `POST /api/auth/register` cierra la sesión del cliente (se borra el estado local de acceso y se redirige a `/login`). Un `401` de login o registro significa "credenciales incorrectas" y no cierra nada.

### 5.3 Decaimiento de Pancho — D4

Hambre y vida son sistemas **distintos**:

> **El hambre disminuye con el tiempo. La vida disminuye únicamente cuando una tarea vence sin entrega.**

**Constantes**

| Constante | Valor |
|---|---|
| Rango de `health` | `0 ≤ health ≤ 100` |
| Rango de `hunger` | `0 ≤ hunger ≤ 100` |
| `health` inicial de un ciclo | `100` |
| `hunger` inicial de un ciclo | `100` |
| `lifeLossPerTask` | `100 / totalAssignments` |
| `hunger` al entregar una tarea a tiempo | `100` |
| `hunger` al vencer una tarea sin entrega | `0` |
| Recompensa de minijuego | `5` coins |

**Vida.** Cada tarea tiene exactamente el mismo peso. Cuando `dueAt` llega y no hay entrega, `health = health − lifeLossPerTask`. Entregar a tiempo no resta vida. La vida nunca disminuye por el simple paso del tiempo y no existe forma de recuperarla dentro de un ciclo.

| `totalAssignments` | `lifeLossPerTask` |
|---|---|
| 5 | 20 |
| 10 | 10 |
| 20 | 5 |

**Hambre.** Solo hay una tarea activa a la vez. Mientras exista:

```
hunger = clamp( (dueAt − now) / (dueAt − windowStart) × 100 , 0, 100 )
```

Ejemplo para una tarea de 5 días:

| Tiempo transcurrido | `hunger` |
|---|---|
| 0 % (inicio) | 100 |
| 25 % | 75 |
| 50 % | 50 |
| 75 % | 25 |
| 100 % (`dueAt`) | 0 |

Definiciones necesarias para que el cálculo sea determinista:

- Las tareas del periodo se ordenan por `dueAt` ascendente.
- `windowStart` de la primera tarea es `period.startDate`; el de las demás es el `dueAt` de la tarea anterior.
- **Tarea activa** (por estudiante): la primera tarea, por `dueAt`, sin entrega de ese estudiante, con `dueAt > now` y con `now ≥ period.startDate`.
- Si no hay tarea activa: `hunger = 0` si la última tarea del periodo se incumplió; en otro caso `100`.

**Decaimiento offline (sin cron ni timers del cliente).** El estado se **deriva de marcas de tiempo** (`dueAt`, `submittedAt`, fechas del periodo) y se calcula en el backend (reconciliación) cada vez que se lee o modifica a Pancho. Si el estudiante no abre la app durante días, al volver se obtiene el mismo resultado que si hubiera estado conectado. La reconciliación es **idempotente**:

```
missed  = nº de tareas del periodo con dueAt ≤ now sin entrega del estudiante
health  = clamp( 100 − (missed × 100) / totalAssignments , 0 , 100 )   // 100 si totalAssignments = 0
status  = (health ≤ 0) ? "dead" : "alive"
```

Se multiplica antes de dividir para evitar errores de redondeo en coma flotante; `health` se persiste sin redondear (el redondeo de presentación queda fuera de este ADR). El valor de `hunger` almacenado es solo un snapshot; el valor devuelto por la API se calcula en cada petición. Los cálculos se hacen con el reloj del servidor, nunca con el del cliente.

### 5.4 Muerte y ausencia de revivir — D5

- Cuando `health ≤ 0`, `status = dead`.
- **No existe revivir**: ni botón para el estudiante, ni revivir manual por el profesor, ni endpoint, ni campos en el modelo relacionados con ello.
- Pancho permanece `dead` durante el resto del periodo actual.
- Al comenzar un **nuevo periodo** se inicia un nuevo ciclo: `health = 100`, `hunger = 100`, `status = alive`.
- Los valores de `status` van **en minúsculas**: `"alive"` y `"dead"`. El prototipo actual del frontend usa `"ALIVE"`/`"DEAD"`; el frontend debe adaptarse al contrato.

### 5.5 Recompensas — D6

- Cada partida válida de minijuego otorga exactamente **5 coins**. La cantidad la fija el servidor; el cliente no la envía.
- Entregar una tarea a tiempo pone `hunger = 100`.

### 5.6 Código de profesor — D7

- Cada classroom tiene un `joinCode` único.
- El profesor lo proporciona al crear el classroom o, si no lo envía, el backend lo genera.
- Los estudiantes lo usan en `POST /api/classrooms/join` para unirse.
- Cada usuario pertenece a **un único classroom** (`users.classroomId`); un profesor administra un único classroom.

### 5.7 Datos locales — D8

Los datos actuales en `localStorage` son datos de prototipo y:

- **no se migran**;
- **no se importan automáticamente** a MongoDB;
- se consideran descartables al pasar a la arquitectura definitiva.

No existirá ningún endpoint ni script de importación de **datos de usuario**. Los usuarios se registran de nuevo y Pancho comienza con los valores iniciales de un ciclo nuevo.

**[Rev. 2] Precisión.** D8 aplica a los datos del usuario (cuentas, mascota, monedas, inventario). El **catálogo de cosméticos** (`src/data/dataset.json`) y el **banco de preguntas** del quiz **sí** se cargan una sola vez a MongoDB mediante un seed (UN-111): son contenido de la aplicación, no estado del usuario.

### 5.8 [Rev. 2] Seguridad del servidor (UN-103)

| Medida | Decisión |
|---|---|
| Cabeceras | `helmet` con su configuración por defecto, verificado por una prueba automatizada |
| Inyección NoSQL | Se eliminan del body y de la query las claves que empiezan por `$` o contienen `.`; además, validación estricta con `zod` 4 que rechaza objetos donde se espera un string. Un login con `{"email":{"$ne":null},"password":{"$ne":null}}` devuelve `400` |
| Tamaño del body | Máximo 10 kB (`express.json({ limit: "10kb" })`); si se excede → `400 VALIDATION_ERROR` |
| Rate limit | En `POST /api/auth/login` y `POST /api/auth/register`. El contador **se guarda en MongoDB** (colección `rate_limits`, sección 8.9), no en memoria, porque las funciones serverless no comparten memoria entre invocaciones. Al superar el límite → `429 RATE_LIMITED` con cabecera `Retry-After` |
| Límites iniciales | Login: 5 intentos por ventana de 15 min por (IP + email). Registro: 10 por hora por (IP + email). Son constantes de configuración y pueden ajustarse sin cambiar el contrato |
| Logs | Nunca se registran body, cookies, cabeceras de autorización ni credenciales de la cadena de conexión; los mensajes y trazas pasan por un filtro de redacción |
| `passwordHash` | `select: false` en el modelo y un filtro global que lo elimina de cualquier respuesta JSON |
| Proxy | `trust proxy = 1` para obtener la IP real del cliente detrás de Vercel |

## 6. Reglas de negocio

1. **Periodo académico.** Cada classroom tiene un periodo con `startDate` y `endDate` (`endDate > startDate`). El periodo determina el ciclo de Pancho y sus tareas.
2. **Tareas.** El profesor define todas las tareas antes de que empiece el periodo (`now < period.startDate`). Una vez iniciado: no se agregan, no se eliminan, no cambia su número total ni sus fechas. Así `100 / totalAssignments` es constante durante todo el periodo.
3. **Una sola tarea activa** por estudiante (definición en 5.3). No hay tareas activas simultáneas.
4. **Fechas de tareas.** Cada `dueAt` debe ser único dentro del periodo y estar dentro de `[startDate, endDate]`, para que el orden y la tarea activa sean inequívocos.
5. **Entregas.** No hay entregas tardías. Solo se acepta entrega sobre la tarea activa y con `now < dueAt`. Al llegar `dueAt` sin entrega, la tarea queda incumplida (se resta `lifeLossPerTask`, `hunger = 0`) y ya no puede entregarse.
6. **Entrega a tiempo.** No resta vida, `hunger = 100`, y se continúa con la siguiente tarea.
7. **Muerte.** `health ≤ 0` ⇒ `status = dead` hasta el siguiente periodo.
8. **Nuevo periodo.** Se reinician `health`, `hunger` y `status` de las mascotas del classroom (ver `POST /api/classrooms/:id/periods`).
9. **Minijuegos.** Cada partida válida suma 5 coins al `pets.coins` del estudiante y registra una fila en `minigame_plays`.
10. **[Rev. 2] Compra de cosméticos.** Comprar un cosmético exige que exista en `cosmetics`, que no esté ya en `pets.inventory` y que `pets.coins ≥ cosmetics.cost`. Se descuenta `cost` y se agrega el `cosmeticId` al inventario en **una sola operación atómica**.
11. **[Rev. 2] Equipar.** Un cosmético solo puede equiparse si está en `pets.inventory` y si su `category` corresponde al slot (`Head`→`head`, `Face`→`face`, `Neck`→`neck`, `Body`→`body`). Un slot vacío vale `null`.

## 7. Contrato REST

### 7.1 Prefijo

Todas las rutas usan **un único prefijo: `/api`**. No se usan rutas fuera de él (por ejemplo, `/auth/...` o `/me/game`). Cuerpos en JSON (`Content-Type: application/json`); fechas en ISO 8601 UTC; identificadores como string.

En el cliente, las rutas se escriben sin el prefijo y la URL base es `/api` (relativa al mismo origen): `api.post("/auth/login", …)` llama a `POST /api/auth/login`.

### 7.2 Autenticación

- Todas las rutas requieren sesión (cookie `httpOnly`, ver 5.2) salvo `POST /api/auth/register`, `POST /api/auth/login` y, **[Rev. 2]**, `GET /api/health`.
- El rol (`student` / `teacher`) se obtiene de la sesión en el servidor.
- Sin sesión válida → `401 UNAUTHORIZED`. Rol insuficiente o recurso de otro classroom → `403 FORBIDDEN`.

### 7.3 Endpoints

**Base** = necesaria para cumplir las reglas de este ADR. **Propuesta** = ruta razonable no cerrada previamente por el equipo que se incluye para completar el contrato.

| Método | Ruta | Propósito | Auth | Rol | Estado |
|---|---|---|---|---|---|
| GET | `/api/health` | Estado del servicio y de la base de datos | **No** | — | Base **[Rev. 2]** |
| POST | `/api/auth/register` | Crear cuenta (inicia sesión) | No | — | Base |
| POST | `/api/auth/login` | Iniciar sesión | No | — | Base |
| POST | `/api/auth/logout` | Cerrar sesión | Sí | cualquiera | Base |
| GET | `/api/me` | Usuario autenticado | Sí | cualquiera | Base |
| PATCH | `/api/me` | Actualizar perfil (`name`) | Sí | cualquiera | Propuesta |
| POST | `/api/classrooms` | Crear classroom y su periodo | Sí | teacher | Base |
| GET | `/api/classrooms/me` | Classroom del usuario (reemplaza `GET /api/classrooms`, dado que hay uno por usuario) | Sí | cualquiera | Propuesta |
| POST | `/api/classrooms/join` | Unirse con `joinCode` (crea a Pancho) | Sí | student | Base |
| POST | `/api/classrooms/:id/periods` | Iniciar un nuevo periodo/ciclo | Sí | teacher (dueño) | Propuesta |
| GET | `/api/assignments` | Tareas del periodo actual del classroom | Sí | cualquiera | Base |
| POST | `/api/assignments` | Crear tarea (solo antes de `startDate`) | Sí | teacher | Base |
| GET | `/api/assignments/:id` | Detalle de una tarea | Sí | cualquiera | Propuesta |
| POST | `/api/assignments/:id/submissions` | Registrar entrega | Sí | student | Base |
| GET | `/api/assignments/:id/submissions` | Entregas de una tarea | Sí | teacher | Propuesta |
| GET | `/api/pets/me` | Estado actual de Pancho | Sí | student | Base |
| GET | `/api/pets/:id` | Estado de un Pancho | Sí | dueño o teacher del classroom | Propuesta |
| POST | `/api/minigames/:id/plays` | Registrar partida y otorgar recompensa | Sí | student | Base |
| GET | `/api/cosmetics` | Catálogo de cosméticos | Sí | cualquiera | Propuesta **[Rev. 2]** |
| POST | `/api/pets/me/inventory` | Comprar un cosmético (`{ "cosmeticId": 3 }`) | Sí | student | Propuesta **[Rev. 2]** |
| PUT | `/api/pets/me/equipped` | Equipar/desequipar (`{ "head": 3, "face": null, "neck": null, "body": null }`) | Sí | student | Propuesta **[Rev. 2]** |
| GET | `/api/quiz-questions` | Preguntas del quiz **sin** `correctIndex` | Sí | student | Propuesta **[Rev. 2]** |

No existen rutas de edición/borrado de tareas ni de revivir (por diseño). La forma de validar las respuestas del quiz y de considerar "válida" una partida está pendiente (sección 12); en ningún caso `correctIndex` se envía al cliente.

### 7.4 Requests

`POST /api/auth/register`
```json
{ "name": "Ana Pérez", "email": "ana@correo.com", "password": "********", "role": "student" }
```

`POST /api/auth/login`
```json
{ "email": "ana@correo.com", "password": "********" }
```

El login se hace **por `email`**. `username` (rev. 1) es opcional y no se usa para autenticar.

`PATCH /api/me`
```json
{ "name": "Ana P." }
```

`POST /api/classrooms`
```json
{
  "name": "Programación I — 2026-2",
  "joinCode": "PROG-2026",
  "period": { "startDate": "2026-08-03T00:00:00Z", "endDate": "2026-12-04T23:59:59Z" }
}
```
`joinCode` es opcional; si se omite, el backend lo genera.

`POST /api/classrooms/join`
```json
{ "joinCode": "PROG-2026" }
```

`POST /api/classrooms/:id/periods`
```json
{ "startDate": "2027-02-01T00:00:00Z", "endDate": "2027-06-04T23:59:59Z" }
```
Validaciones: `startDate < endDate` y que no se solape con el periodo vigente.

`POST /api/assignments`
```json
{ "title": "Taller 1", "description": "Resolver ejercicios 1–5", "dueAt": "2026-08-10T23:59:00Z" }
```
`classroomId` y `periodId` se toman del classroom del profesor autenticado.

`POST /api/assignments/:id/submissions` — solo metadata; el archivo vive en el almacenamiento externo:
```json
{ "fileName": "taller1.pdf", "fileUrl": "https://…", "storageKey": "classrooms/…/taller1.pdf" }
```

`POST /api/minigames/:id/plays` — `:id` es el `gameId`; sin cuerpo relevante. La recompensa no se acepta del cliente.

### 7.5 Responses

Éxito: `200` (lectura/actualización), `201` (creación), `204` (logout, sin cuerpo). Nunca se devuelve `passwordHash`.

`GET /api/health`
```json
{ "status": "ok", "database": "connected", "timestamp": "2026-11-01T12:00:00.000Z" }
```

`GET /api/me`
```json
{ "user": { "id": "665f…", "name": "Ana Pérez", "email": "ana@correo.com", "role": "student", "classroomId": "665a…", "createdAt": "2026-08-01T12:00:00Z" } }
```

`GET /api/pets/me` — `hunger` calculado en el momento de la petición:
```json
{
  "pet": {
    "id": "6660…", "ownerId": "665f…", "name": "Pancho",
    "health": 80, "hunger": 50, "coins": 15, "status": "alive",
    "inventory": [3, 7], "equipped": { "head": 3, "face": null, "neck": null, "body": 7 },
    "periodId": "6661…", "updatedAt": "2026-08-12T10:00:00Z"
  },
  "rules": { "totalAssignments": 5, "lifeLossPerTask": 20, "missedAssignments": 1 },
  "activeAssignment": { "id": "6662…", "title": "Taller 2", "dueAt": "2026-08-17T23:59:00Z" }
}
```
`activeAssignment` es `null` si no hay tarea activa.

`POST /api/assignments/:id/submissions` (201)
```json
{
  "submission": { "id": "6663…", "assignmentId": "6662…", "studentId": "665f…", "fileName": "taller1.pdf", "submittedAt": "2026-08-12T10:00:00Z", "status": "submitted" },
  "pet": { "health": 80, "hunger": 100, "coins": 15, "status": "alive" }
}
```

`POST /api/minigames/:id/plays` (201)
```json
{
  "play": { "id": "6664…", "gameId": "memory", "reward": 5, "playedAt": "2026-08-12T10:05:00Z" },
  "pet": { "coins": 20 }
}
```

`POST /api/pets/me/inventory` (201)
```json
{ "pet": { "coins": 120, "inventory": [3, 7, 9] } }
```

`GET /api/cosmetics`
```json
{ "cosmetics": [ { "cosmeticId": 3, "name": "Skully Bow", "category": "Head", "cost": 150, "image": "images/skully-bow.png" } ] }
```

`POST /api/classrooms` (201) devuelve el classroom con su `joinCode` y `period`.

### 7.6 Errores

**Todos** los errores de la API usan exactamente esta estructura:

```json
{ "error": { "code": "ERROR_CODE", "message": "Mensaje legible" } }
```

No se agregan otros campos a `error`; cualquier detalle de validación va en `message`. Los mensajes de validación están en español.

| `code` | Cuándo |
|---|---|
| `VALIDATION_ERROR` | Cuerpo/parámetros inválidos, JSON mal formado o body mayor de 10 kB |
| `UNAUTHORIZED` | Sin sesión, sesión inválida o credenciales incorrectas |
| `FORBIDDEN` | Rol insuficiente, recurso fuera del classroom del usuario u **origen no permitido** (5.2) |
| `NOT_FOUND` | Recurso o `joinCode` inexistente; ruta `/api/...` desconocida |
| `CONFLICT` | Duplicado o estado incompatible (email ya registrado, usuario ya en un classroom, tarea ya entregada, tarea no activa, periodo no iniciado, cosmético ya comprado, monedas insuficientes) |
| `ASSIGNMENT_EXPIRED` | Intento de entregar con `now ≥ dueAt` |
| `PERIOD_LOCKED` | Intento de crear/modificar tareas con el periodo ya iniciado |
| `RATE_LIMITED` | **[Rev. 2]** Demasiados intentos de login o registro (5.8) |
| `INTERNAL_ERROR` | Error inesperado del servidor |

### 7.7 Códigos HTTP

| HTTP | `error.code` |
|---|---|
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT`, `ASSIGNMENT_EXPIRED`, `PERIOD_LOCKED` |
| 429 | `RATE_LIMITED` **[Rev. 2]** |
| 500 | `INTERNAL_ERROR` |

## 8. Modelo MongoDB

**Principios.** Se embeben datos pequeños, de cardinalidad acotada y con el mismo ciclo de vida que su documento padre. Se usan referencias (`ObjectId`) para relaciones de crecimiento no acotado o de alta cardinalidad (usuarios, tareas, entregas, partidas). Las constantes de reglas (5 coins, 100/100) viven en configuración del backend, no en la base de datos; por eso `classrooms` no necesita `settings` en este ADR. **[Rev. 2]** El catálogo de cosméticos y el banco de preguntas **sí** viven en MongoDB (no en archivos ni en arreglos en memoria del servidor), porque son contenido editable de la aplicación.

**Colecciones de dominio (8):** `users`, `classrooms`, `assignments`, `pets`, `submissions`, `minigame_plays`, `cosmetics`, `quiz_questions`. **Infraestructura (1):** `rate_limits`.

| Dato | Estrategia | Motivo |
|---|---|---|
| `period` dentro de `classrooms` | **Embebido** | 1:1, pequeño, mismo ciclo de vida que el classroom |
| `totalAssignments` dentro de `period` | **Embebido (denormalizado)** | Evita contar tareas en cada cálculo de `lifeLossPerTask`; es inmutable una vez iniciado el periodo |
| Usuarios de un classroom | Referencia (`users.classroomId`) | Crecen sin límite claro |
| Tareas | Colección propia (`classroomId`, `periodId`) | Crecen por periodo y se consultan/ordenan por separado |
| Entregas | Colección propia | Alta cardinalidad (estudiantes × tareas) |
| Partidas de minijuego | Colección propia | Crecimiento ilimitado; `pets` solo guarda el saldo (`coins`) |
| `inventory` y `equipped` dentro de `pets` | **Embebido** **[Rev. 2]** | Acotado por el tamaño del catálogo; se lee siempre junto con Pancho |
| Cosméticos e inventario | Referencia por número (`cosmetics.cosmeticId`) | Se conserva el id numérico del `dataset.json` que ya usa el frontend |

### 8.1 users

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | |
| `name` | string | 2–80 caracteres (límites de implementación) |
| `username` | string | **Opcional** (rev. 1). 3–30 caracteres, minúsculas. Índice único parcial |
| `email` | string | Único, normalizado a minúsculas, máx. 254 |
| `passwordHash` | string | Nunca se expone en la API (`select: false`) |
| `role` | `"student"` \| `"teacher"` | |
| `classroomId` | ObjectId \| null | Un solo classroom por usuario |
| `createdAt` | Date | |

Índices: único en `email`; índice en `classroomId`; único **parcial** en `username` (`partialFilterExpression: { username: { $type: "string" } }`, de modo que varios usuarios sin `username` no choquen).

### 8.2 classrooms

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | |
| `name` | string | |
| `teacherId` | ObjectId | Ref. a `users` |
| `joinCode` | string | Único (D7); se guarda en mayúsculas |
| `period` | objeto embebido | Ver abajo |
| `createdAt` | Date | |

`period`:

| Campo | Tipo | Notas |
|---|---|---|
| `periodId` | ObjectId | Identifica el ciclo; lo referencian `assignments` y `pets`. Se genera automáticamente |
| `startDate` | Date | |
| `endDate` | Date | Debe ser posterior a `startDate` (validado en el modelo) |
| `totalAssignments` | int | Contador, por defecto `0`; solo se incrementa antes de `startDate` |

Índices: único en `joinCode`; único en `teacherId` (un classroom por profesor).

### 8.3 assignments

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | |
| `classroomId` | ObjectId | |
| `periodId` | ObjectId | Periodo al que pertenece |
| `title` | string | |
| `description` | string | |
| `dueAt` | Date | **Obligatorio**; fecha límite; define el orden |
| `createdAt` | Date | |

Índices: único `{ classroomId, periodId, dueAt }` (garantiza orden inequívoco y una sola tarea activa). La tarea activa se obtiene por consulta (ver 5.3), no se almacena. Que `dueAt` caiga dentro de `[startDate, endDate]` lo valida el servicio.

### 8.4 pets

Representa a Pancho. Un documento por estudiante; al empezar un nuevo periodo se **reinicia** el mismo documento.

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | |
| `ownerId` | ObjectId | Ref. a `users` (estudiante) |
| `periodId` | ObjectId | Ciclo actual |
| `name` | string | Por defecto `"Pancho"` |
| `health` | number | 0–100 |
| `hunger` | number | 0–100 (snapshot; el valor vigente se calcula) |
| `coins` | int | Saldo; incrementado/decrementado con operadores atómicos (`$inc`) |
| `inventory` | `[number]` | **[Rev. 2]** `cosmeticId` de los cosméticos comprados. Por defecto `[]`. Sin duplicados |
| `equipped` | objeto | **[Rev. 2]** `{ head, face, neck, body }`; cada valor es un `cosmeticId` (number) o `null`. Por defecto todos `null` |
| `status` | `"alive"` \| `"dead"` | Minúsculas |
| `createdAt` | Date | |
| `updatedAt` | Date | |

Índice: único en `ownerId`. No hay campos relacionados con revivir. El inventario vive **solo** en `pets`; `users` no tiene inventario.

### 8.5 submissions

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | |
| `assignmentId` | ObjectId | |
| `studentId` | ObjectId | |
| `fileName` | string | |
| `fileUrl` | string | Referencia al archivo en el almacenamiento externo |
| `storageKey` | string | Clave del objeto; independiente del proveedor |
| `submittedAt` | Date | Siempre `< assignment.dueAt` (lo valida el servicio) |
| `status` | string | Único valor actual: `"submitted"` |

Índice: único `{ assignmentId, studentId }` (una entrega por tarea). Las tareas incumplidas **no** generan documento: se derivan por ausencia de entrega.

### 8.6 minigame_plays

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | |
| `studentId` | ObjectId | |
| `gameId` | string | Tomado de `:id` en la ruta |
| `reward` | int | Siempre `5` |
| `playedAt` | Date | |

Índice: `{ studentId, playedAt }`. Registrar la partida y sumar a `pets.coins` debe hacerse en una transacción (o con un orden que tolere fallos parciales).

### 8.7 cosmetics **[Rev. 2]**

Catálogo de la tienda; los campos salen 1:1 de `src/data/dataset.json`. Se carga con el seed de UN-111.

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | |
| `cosmeticId` | int | Id numérico del dataset; único. Es el valor que se guarda en `pets.inventory` y `pets.equipped` |
| `name` | string | |
| `category` | `"Head"` \| `"Face"` \| `"Neck"` \| `"Body"` | Determina el slot en `equipped` |
| `cost` | int | ≥ 0 |
| `image` | string | Ruta relativa, p. ej. `images/skully-bow.png` |

Índice: único en `cosmeticId`.

### 8.8 quiz_questions **[Rev. 2]**

Banco de preguntas del minijuego de quiz; los campos salen 1:1 de `src/pages/minigames/quizQuestions.js`. Se carga con el seed de UN-111.

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | ObjectId | |
| `questionId` | string | Clave natural (`"q1"`, `"q2"`, …); único |
| `prompt` | string | |
| `options` | `[string]` | Al menos 2 |
| `correctIndex` | int | Dentro del rango de `options`. **Nunca se envía al cliente** |

Índice: único en `questionId`.

### 8.9 rate_limits **[Rev. 2]**

Colección de infraestructura para el rate limit (5.8); no es un modelo de dominio.

| Campo | Tipo | Notas |
|---|---|---|
| `key` | string | Único. Formato `<scope>:ip-email:<ip>:<hash>`; el email se guarda solo como hash |
| `count` | int | Intentos dentro de la ventana |
| `expiresAt` | Date | Fin de la ventana |

Índices: único en `key`; **TTL** en `expiresAt` (`expireAfterSeconds: 0`). El monitor TTL de MongoDB corre aproximadamente cada 60 s, por lo que el middleware también compara fechas por su cuenta.

## 9. Almacenamiento de archivos

- Los archivos entregados se guardan en **Cloud/Object Storage externo**. El **proveedor está pendiente** y este ADR no elige ninguno.
- MongoDB **no** almacena binarios; solo metadata y referencias: `fileName`, `fileUrl`, `storageKey`, `submittedAt`.
- El diseño es independiente del proveedor: `storageKey` identifica el objeto y `fileUrl` es la referencia de acceso, de modo que cambiar de proveedor implica cambiar la capa de almacenamiento del backend, no el esquema.
- El mecanismo de subida (directa desde el cliente o a través del backend), tipos permitidos y tamaño máximo quedan **pendientes de decisión**.

## 10. Hosting

> Nota: el ticket UN-001 se refiere a la decisión sobre el hosting del frontend como "sección 9". En este documento esa decisión está en esta sección 10 (la 9 trata el almacenamiento de archivos).

| Componente | Decisión |
|---|---|
| Frontend | **Vercel** — mismo proyecto que la API |
| Backend / API | **Vercel** (función serverless en `api/index.js`, rutas bajo `/api/...`) |
| Base de datos | **MongoDB Atlas** |
| Archivos | Cloud/Object Storage — proveedor pendiente |

**Decisión sobre el hosting del frontend:** el frontend se despliega en Vercel junto con el backend, de modo que frontend y `/api` comparten origen. Esto habilita la cookie `httpOnly` con `SameSite=Lax` sin CORS con credenciales (5.2).

**[Rev. 2] Un solo proyecto Vercel, desplegado desde la raíz del repositorio.** El frontend **no** se publica en GitHub Pages ni en un segundo proyecto. Esa alternativa se descartó porque con frontend y API en dominios distintos el navegador no enviaría la cookie `SameSite=Lax` en las peticiones `fetch` entre sitios, y la sesión dejaría de funcionar.

| Ajuste | Valor |
|---|---|
| Root Directory | Raíz del repositorio (**no** `server/`) |
| Framework Preset | Vite |
| Build Command / Output Directory | `npm run build` / `dist` |
| `vite.config.js` | `base: "/"` (el sitio vive en la raíz del dominio) |
| `vercel.json` | `rewrites`: `/api/(.*)` → `/api`; el resto, excepto `/api/`, → `/index.html` (rutas de React Router) |
| Dependencias | Un solo `package.json` en la raíz (el frontend y la función `api/` las comparten) |
| Desarrollo local | `npm run dev:server` (API en el puerto 3000) y `npm run dev` (Vite, con proxy de `/api` a `localhost:3000`) |

Implicaciones: las credenciales (cadena de conexión a Atlas `MONGODB_URI`, secreto de sesión) se configuran como variables de entorno en Vercel y no se suben al repositorio (`.env.example` solo lista nombres); al ser funciones serverless, el cliente de MongoDB se cachea en `global` y se reutiliza entre invocaciones; el acceso de red de Atlas debe permitir las conexiones desde Vercel; y cada despliegue de previsualización tiene su propio host, por lo que las cookies de sesión no se comparten entre despliegues.

## 11. Consecuencias

**Positivas**

- Reglas simples: todas las tareas pesan lo mismo y la vida es predecible.
- La vida solo depende de tareas vencidas sin entrega; no hay pérdida continua por tiempo.
- Sin revivir ni intervención manual: menos endpoints, menos estados y menos abuso posible.
- Estado derivado de marcas de tiempo: no hacen falta cron ni procesos en segundo plano, y el decaimiento offline es correcto por construcción.
- MongoDB no almacena binarios; el modelo es independiente del proveedor de archivos.
- Separación clara entre frontend, backend, base de datos y almacenamiento.
- Autenticación con cookie `httpOnly`, sin tokens expuestos al JavaScript del cliente.
- Un único prefijo `/api` y un único formato de error simplifican el cliente.
- **[Rev. 2]** Un solo proyecto Vercel: sin CORS en producción, un solo despliegue y un solo conjunto de variables de entorno.
- **[Rev. 2]** El rate limit sobrevive al modelo serverless porque su estado está en MongoDB.

**Trade-offs**

- El número de tareas debe quedar definido al inicio del periodo; después no se puede cambiar.
- Las tareas y sus fechas no se modifican una vez iniciado el periodo; un error de configuración no se corrige dentro del periodo.
- Con pesos iguales que suman 100, `health` solo llega a 0 cuando se incumplen **todas** las tareas del periodo; Pancho morirá, como muy pronto, en el `dueAt` de la última tarea.
- El modelo exige conocer `totalAssignments` antes de calcular la pérdida por tarea (de ahí el bloqueo del periodo).
- El proveedor de almacenamiento sigue sin definirse, lo que bloquea el flujo final de subida de archivos.
- Cookie con `SameSite=Lax` asume mismo origen; separar el dominio del frontend y de la API exigiría revisar esta decisión.
- El cálculo en cada lectura añade lógica en el backend (consulta de tareas y entregas por petición).
- **[Rev. 2]** El rate limit añade una escritura a MongoDB en cada intento de login o registro.
- **[Rev. 2]** Se abandona la URL de GitHub Pages; los enlaces antiguos (README, documentación) deben actualizarse.

## 12. Decisiones pendientes / fuera de alcance

**Pendiente de decisión**

- Proveedor de Cloud/Object Storage y mecanismo de subida de archivos.
- Tipos de archivo permitidos y tamaño máximo.
- Formato y longitud del `joinCode`.
- Duración de la sesión y formato interno del valor de la cookie (JWT firmado o id de sesión en MongoDB; siempre dentro de la cookie, ver 5.2).
- Si Pancho en estado `dead` puede seguir entregando tareas, jugando minijuegos, comprando o equipando cosméticos.
- Tratamiento de estudiantes que se unen con el periodo ya iniciado (las tareas ya vencidas contarían como incumplidas salvo que se decida lo contrario).
- Si `coins`, `inventory` y `equipped` se conservan al iniciar un nuevo periodo (el reinicio definido afecta solo a `health`, `hunger` y `status`).
- Catálogo de `gameId` válidos y validación de que una partida es legítima (incluida la forma de validar las respuestas del quiz sin exponer `correctIndex`).
- **[Rev. 2]** Monedas iniciales de Pancho al crearse: el prototipo usa 270, pero el ADR no las define; el modelo exige indicarlas explícitamente al unirse al classroom.
- **[Rev. 2]** Valores definitivos del rate limit (5.8) y si el contador de login se reinicia tras un inicio de sesión correcto.
- **[Rev. 2]** Confirmación de la revisión 1 (`users.username`).

**Fuera del alcance de este ADR**

- Diseño visual y detalles de UI.
- Sistema de calificación y uso de Pancho como nota.
- Revivir (no existe).
- Entregas tardías (no existen).
- Múltiples tareas activas (no existen).
- Modificación de tareas después de iniciado el periodo (no se permite).
- Importación de datos de usuario desde `localStorage` (D8).

## 13. Firmas / aprobación

**Revisión 0** — revisada y aprobada por los cuatro integrantes del equipo el 2026-10-29.

| Integrante | Rol | Rev. 0 | Rev. 2 |
|---|---|---|---|
| Karol | Lead | Aprobado | Pendiente |
| Isaac | API / Desarrollo | Aprobado | Pendiente |
| Nicolás | MongoDB / Desarrollo | Aprobado | Pendiente |
| Mariana | UX/UI | Aprobado | Pendiente |

**Estado de aprobación de la revisión 2:** pendiente. Cuando los cuatro integrantes confirmen, se cambia cada celda a "Aprobado" con la fecha y se actualiza la sección 1.

## 14. Criterios de aceptación de UN-001

| Criterio del ticket | Dónde se cumple | Estado |
|---|---|---|
| ADR en `/docs` firmado por los 4 | Este archivo (`docs/ADR-001-api-mongodb.md`); firmas en la sección 13 | Rev. 0 firmada; **rev. 2 pendiente** |
| Constantes de decaimiento con números | 5.3 (tabla de constantes y ejemplos) | Cumplido |
| Contrato acordado por Karol e Isaac | Sección 7 | Rev. 0 acordado; **cambios de rev. 2 pendientes de su firma** |
| Core features confirmadas | Sección 4 (funcionalidades núcleo) y 7.3 (endpoints Base) | Cumplido |
| Decisión escrita sobre el hosting del front | Sección 10 | Cumplido (rev. 2: un solo proyecto Vercel) |
| D2, D4, D5, D6, D7, D8 cerradas | Tabla de decisiones en la sección 4 | Cumplido |
| Contrato REST con errores `{ error: { code, message } }` y un único prefijo | 7.1 y 7.6 | Cumplido |
| Esquema Mongo con datos embebidos | Sección 8 | Cumplido (6 colecciones originales + `cosmetics` y `quiz_questions` de UN-102) |
