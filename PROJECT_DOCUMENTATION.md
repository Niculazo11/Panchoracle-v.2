# Raise a Pancho — Documentación Técnica del Proyecto

> **Estado del documento:** generado a partir de una revisión real del código del repositorio `Panchoracle-v.2` (snapshot del frontend). La Fase 1 descrita aquí **está implementada y verificada en el código**. La Fase 2 (backend, JWT, MongoDB, Helmet, despliegue en Vercel) se documenta como **arquitectura objetivo / plan de trabajo**, porque ese código **todavía no existe en este repositorio**. Cuando se implemente, cada apartado de la Fase 2 debe actualizarse para reflejar el código real, igual que se hizo con la Fase 1.

---

## 1. Título del Proyecto y Descripción General

**Raise a Pancho** es una plataforma web educativa interactiva en la que cada estudiante adopta y cuida a una mascota virtual (un "Pancho", un perro salchicha) que evoluciona a medida que el estudiante completa tareas académicas asignadas por su profesor. El cuidado del Pancho (alimentarlo, vestirlo con cosméticos, mantener sus estadísticas) funciona como una capa de gamificación sobre el seguimiento académico: completar asignaciones otorga monedas y recompensas que el estudiante usa para mantener y personalizar a su mascota.

El proyecto está pensado con dos roles de usuario:

- **Estudiante:** adopta un Pancho, completa asignaciones, gana monedas, compra y equipa cosméticos, y consulta sus propias estadísticas.
- **Profesor:** crea y gestiona asignaciones, registra/administra estudiantes y supervisa el progreso del curso.

> **Nota de estado:** en el código actual, el rol de **Profesor** y el backend que lo soportaría no están implementados. Hoy el proyecto es un frontend funcional en React que simula el progreso del Estudiante con datos guardados en `localStorage`, sin backend ni base de datos real. La sección 3 detalla qué existe y qué falta por cada rol.

---

## 2. Arquitectura e Historia de Requisitos (Fase 1 y Fase 2)

### 2.1 Fase 1 — Frontend (✅ Implementado)

La Fase 1 construyó el frontend completo en React, con todos los datos persistidos de forma local en el navegador (sin backend). Esto es lo que hay en el repositorio hoy:

| Requisito | Estado | Evidencia en el código |
|---|---|---|
| Componentes bien estructurados, ninguno >80 líneas | ✅ Cumplido | Todos los `.jsx` de `src/` están por debajo de 80 líneas. Páginas grandes (p. ej. `Shop`, `RaisePancho`, `CosmeticDetail`) se dividen en subcomponentes de responsabilidad única dentro de subcarpetas (`pages/shop/`, `pages/raise/`, `pages/home/`, etc.). |
| Mínimo 3 rutas, con al menos 1 ruta dinámica (`useParams`) | ✅ Cumplido | Ver tabla de rutas en 2.1.1. Hay más de 10 rutas públicas/privadas, y 2 rutas dinámicas: `/stats/:username` y `/Shop/:cosmeticId`. |
| Rutas protegidas que redirigen a usuarios no autenticados | ✅ Cumplido | `src/components/ProtectedRoute.jsx` protege `/raise`, `/stats`, `/shop`, `/Shop/:cosmeticId` y `/minigames`, redirigiendo a `/login` si no hay sesión. |
| Al menos un Custom Hook propio | ✅ Cumplido (13 hooks) | `src/lib/use*.js` y hooks por página (`useChooseForm`, `useLoginForm`, `useJoinForm`, etc.). Ver detalle en 2.1.2. |
| Despliegue inicial en GitHub Pages, accesible desde cualquier dispositivo | ✅ Configurado | `vite.config.js` define `base: "/Panchoracle-v.2/"`, el router usa `basename={import.meta.env.BASE_URL}`, y `package.json` tiene scripts `predeploy`/`deploy` con `gh-pages`. El diseño usa Tailwind con clases responsive (`sm:`, `md:`, `lg:`). |

**Stack de la Fase 1:**

- **React 18** + **React Router DOM 6** (enrutado por cliente, `BrowserRouter`).
- **Vite 5** como bundler/dev server.
- **Tailwind CSS 3** para estilos.
- **Estado del juego:** un `Context` propio (`src/state/GameStateContext.jsx` + `src/state/gameState.js`) que centraliza el estado del estudiante y del Pancho (hambre, felicidad, monedas, cosméticos equipados, asignación activa), con acciones puras separadas por dominio en `src/state/actions/` (`pancho.js`, `shop.js`, `assignment.js`, `lifecycle.js`).
- **Persistencia:** `localStorage`, a través de `src/state/storage.js` y `src/lib/dogStorage.js`. No hay llamadas a un backend propio; la única petición de red real es a la API pública `https://dog.ceo/api/...` para una de las imágenes de perro al elegir mascota (ver `src/lib/dogApi.js`).
- **"Autenticación" actual:** una bandera booleana (`panchoAccess`) en `localStorage`, gestionada por `src/lib/auth.js` y expuesta a React vía el hook `useAccess` (`useSyncExternalStore`). No hay contraseñas verificadas contra un servidor ni tokens: es un control de acceso puramente de cliente, suficiente para cumplir el requisito de "ruta protegida" de la Fase 1, pero **no apto como seguridad real** (de ahí el objetivo de la Fase 2).

#### 2.1.1 Tabla de rutas (`src/App.jsx`)

| Ruta(s) | Página | Tipo | Protegida |
|---|---|---|---|
| `/` | `Home` | Pública | No |
| `/login` | `Login` | Pública | No |
| `/aboutus`, `/aboutus.html` | `AboutUs` | Pública | No |
| `/choose`, `/choosePancho`, `/choosePancho.html` | `ChoosePancho` | Pública (es el punto de entrada que crea la "cuenta") | No |
| `/dogpark-login`, `/dogParkLogin.html` | `DogParkLogin` | Pública (gate independiente, no usa `auth.js`) | No |
| `/dogpark`, `/dogPark.html` | `DogParkPlaceholder` | Pública | No |
| `/raise`, `/raisePancho`, `/raisePancho.html` | `RaisePancho` | Privada | **Sí** |
| `/stats/:username`, `/stats`, `/panchoStats`, `/panchoStats.html` | `PanchoStats` | Privada, **dinámica** (`useParams`) | **Sí** |
| `/shop`, `/Shop`, `/Shop.html` | `Shop` | Privada | **Sí** |
| `/Shop/:cosmeticId` | `CosmeticDetail` | Privada, **dinámica** (`useParams`) | **Sí** |
| `/minigames`, `/MiniGames`, `/MiniGames.html` | `MiniGames` | Privada | **Sí** |

Cada ruta privada se envuelve en `<ProtectedRoute>`, que:
1. Lee el estado de acceso con `useAccess()`.
2. Si no hay acceso, redirige con `<Navigate replace to="/login" state={{ from: location }} />`, guardando la ruta de origen para poder volver a ella tras el login.

#### 2.1.2 Custom Hook de referencia (dependencias y cleanup)

Como ejemplo representativo para la defensa oral, `src/lib/useDogImages.js` encapsula la carga de las imágenes de Pancho disponibles:

- **Qué resuelve:** separa la lógica de "pedir imágenes, manejar carga/offline/error y cachear el resultado" de la página `ChoosePancho`, que solo consume `{ images, loading, error, offline, reload }`.
- **Array de dependencias:** el `useEffect` interno vuelve a ejecutarse solo cuando cambia su "tick" de recarga interno (controlado por `reload()`), no en cada render; evita repetir la petición de red innecesariamente.
- **Cleanup:** usa un `AbortController` creado dentro del efecto. La función de limpieza del `useEffect` llama a `controller.abort()`, de modo que si el componente se desmonta (o se dispara una nueva carga) antes de que la petición a `dog.ceo` responda, la respuesta tardía se descarta y no intenta actualizar el estado de un componente ya desmontado.

Otros hooks propios en el proyecto (13 en total): `useAccess`, `useChangeFlash`, `useDarkMode`, `useFavorites`, `useFeedback`, `useStatus`, `useChooseForm`, `useConfirmPancho`, `useDogParkLogin`, `useBenefitsSearch`, `useJoinForm`, `useLoginForm`, `useQuiz` (14 en total junto con `useDogImages`). `usePageStyles` existió en una versión anterior (inyectaba un `<style>` con CSS plano para la página `AboutUs`) y se eliminó al unificar esa página hacia Tailwind puro; ver la Bitácora (sección 7).

#### 2.1.3 Mini Juegos (gameplay, sigue siendo Fase 1 / solo frontend)

`/minigames` dejó de ser un placeholder: incluye un quiz corto de trivia académica (`src/pages/minigames/`) como primer ejemplo funcional. Los estudiantes ganan monedas por jugar, de forma separada del flujo académico de `RaisePancho` (que solo restaura Hambre, nunca monedas — ver `SUBMIT_REWARDS` en `state/constants.js`).

- **`src/pages/minigames/useQuiz.js`:** custom hook que gestiona el estado de una ronda (pregunta actual, respuesta seleccionada, aciertos, si terminó). No requiere cleanup: no abre timers ni listeners, solo reacciona a los clics del jugador.
- **`src/state/actions/minigames.js` → `awardMinigameCoins`:** sigue el mismo patrón que el resto de `state/actions/` (recibe el estado, devuelve un estado nuevo sin mutar). Otorga 1 moneda por respuesta correcta, hasta el tope `MINIGAME_REWARD_COINS = 5` definido en `state/constants.js` (mismo valor que ya documentaba la FAQ de `AboutUs`: "+5 coins" por minijuego completado). Las monedas solo se otorgan cuando el estudiante pulsa "Claim coins" explícitamente, nunca de forma automática.
- Sigue siendo 100% `localStorage` (Fase 1): no depende de nada de la Fase 2.

### 2.2 Fase 2 — Backend, Seguridad y Despliegue Full Stack (🔲 Planeado, no implementado)

> Todo lo que sigue en esta sección es el **diseño objetivo**. Ningún archivo de backend existe aún en el repositorio (no hay carpeta `server/`, ni `package.json` con `express`/`jsonwebtoken`/`mongoose`/`helmet`, ni `vercel.json`). Esta sección sirve como especificación para implementar y como checklist a marcar/actualizar a medida que se construya.

**Objetivo de la Fase 2:** reemplazar `localStorage` y la bandera de acceso del cliente por un backend real con persistencia en base de datos y autenticación verificada en el servidor, sin eliminar ni romper el frontend de la Fase 1 (el contrato de datos del `GameStateContext` debe poder alimentarse desde la API en vez de desde `localStorage`).

| Requisito | Estado | Qué falta construir |
|---|---|---|
| CRUD completo contra MongoDB Atlas (sin datos in-memory) | 🔲 No implementado | Servidor Node/Express, modelos de Mongoose (`Student`, `Teacher`, `Assignment`, `Pancho`/`Dog`, `Cosmetic`/inventario), conexión a Atlas vía variable de entorno, y endpoints CRUD reales. |
| JWT con roles `Estudiante` y `Profesor`, validado en backend | 🔲 No implementado | Endpoint de login que emita JWT firmado, middleware de verificación de token, middleware de autorización por rol que bloquee en el servidor (no solo ocultar UI) las acciones exclusivas de Profesor. |
| Despliegue full stack en Vercel (frontend + API) | 🔲 No implementado | El frontend hoy se despliega en **GitHub Pages**, no en Vercel. Habría que decidir si Vercel reemplaza a GitHub Pages para el frontend o convive con él, y desplegar el backend como funciones serverless o servidor Node en Vercel. |
| Seguridad: XSS, inyección NoSQL, `helmet` | 🔲 No implementado | Agregar `helmet` al servidor Express, sanitización de entradas (p. ej. `express-mongo-sanitize` contra inyección NoSQL, `express-validator`/`zod` para validar payloads), escape/sanitización de cualquier HTML generado a partir de input de usuario para mitigar XSS, CORS configurado explícitamente, rate limiting en endpoints sensibles (login). |

#### 2.2.1 Arquitectura objetivo propuesta

```
Frontend (React + Vite)          Backend (Node.js + Express)        Base de datos
┌───────────────────────┐        ┌────────────────────────┐        ┌──────────────┐
│ GameStateContext       │  JWT   │ /api/auth/*            │        │ MongoDB Atlas │
│ (hoy: localStorage)    │ <----> │ /api/students/*        │ <----> │ - students    │
│ (futuro: fetch a API)  │ Bearer │ /api/teachers/*         │        │ - teachers    │
│ ProtectedRoute         │ token  │ /api/assignments/*      │        │ - assignments │
│ (hoy: useAccess local) │        │ /api/panchos/*          │        │ - panchos     │
└───────────────────────┘        │ middlewares: helmet,    │        └──────────────┘
                                  │ cors, sanitize, auth,   │
                                  │ authorize(role)         │
                                  └────────────────────────┘
```

Esta migración implica, en el frontend, reemplazar gradualmente:
- `src/lib/auth.js` / `useAccess.js` → llamadas reales de login/registro contra `/api/auth/login`, guardando el JWT (idealmente en memoria + refresh, o en `httpOnly cookie` emitida por el backend en vez de `localStorage`, para reducir superficie de XSS).
- `src/state/storage.js` / `dogStorage.js` → peticiones `fetch`/`axios` al backend para leer y escribir el estado del Pancho y del estudiante.

---

## 3. Estructura de Roles y Permisos (Estudiante vs. Profesor)

### 3.1 Estado actual (Fase 1)

Solo existe, de facto, un flujo de **Estudiante**: cualquier persona que complete el formulario de `ChoosePancho` "crea una cuenta" local (nombre guardado en `localStorage`) y obtiene acceso a las rutas protegidas. No hay un rol de Profesor ni una distinción real de permisos; no hay nada que impida a cualquier usuario del navegador ver o modificar cualquier dato, porque todo vive en su propio `localStorage`.

### 3.2 Diseño objetivo de permisos (Fase 2, a implementar)

| Acción | Estudiante | Profesor |
|---|---|---|
| Registrarse / iniciar sesión | ✅ | ✅ |
| Adoptar y personalizar su propio Pancho | ✅ | ❌ (no aplica) |
| Ver sus propias estadísticas (`/stats/:username` propio) | ✅ | — |
| Ver estadísticas de **cualquier** estudiante del curso | ❌ | ✅ |
| Completar/entregar asignaciones propias | ✅ | ❌ |
| Crear, editar o eliminar asignaciones | ❌ | ✅ |
| Registrar o dar de baja estudiantes | ❌ | ✅ |
| Ver el progreso agregado del curso | ❌ | ✅ |

**Principio de diseño obligatorio:** la UI puede ocultar botones según el rol, pero eso es solo cosmético. Cada endpoint del backend que modifique o exponga datos sensibles **debe** validar en el servidor, a partir del rol contenido en el JWT verificado (no en un valor enviado por el cliente), que el usuario autenticado tiene permiso para esa acción. Un estudiante que llame directamente a `POST /api/assignments` con su propio token válido debe recibir `403 Forbidden`, incluso si nunca pasó por la UI de profesor.

---

## 4. Endpoints de la API & Seguridad (CRUD, JWT, Helmet, Sanitización)

> ⚠️ Ninguno de los endpoints listados abajo existe todavía en el repositorio. Se documentan como el contrato objetivo a implementar en la Fase 2, para que frontend y backend se desarrollen contra la misma referencia. Al implementarlos, actualizar esta tabla con la ruta real, y mover esta nota de advertencia.

### 4.1 Autenticación

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | Público | Crea un usuario (`role: "student" \| "teacher"`), hashea la contraseña (`bcrypt`). |
| `POST` | `/api/auth/login` | Público | Verifica credenciales, emite JWT firmado con `{ sub, role }` y expiración corta. |
| `POST` | `/api/auth/logout` | Autenticado | Invalida la sesión (si se usa cookie httpOnly) o es un no-op si el token se descarta en cliente. |

### 4.2 Estudiantes

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| `GET` | `/api/students/me` | Estudiante | Perfil y estado del propio Pancho. |
| `PATCH` | `/api/students/me` | Estudiante | Actualiza datos propios (p. ej. cosméticos equipados). |
| `GET` | `/api/students` | Profesor | Lista de estudiantes del curso. |
| `GET` | `/api/students/:id` | Profesor | Detalle/estadísticas de un estudiante puntual. |
| `DELETE` | `/api/students/:id` | Profesor | Da de baja a un estudiante. |

### 4.3 Asignaciones

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| `GET` | `/api/assignments` | Estudiante, Profesor | Estudiante ve las suyas; profesor ve todas las que creó. |
| `POST` | `/api/assignments` | Profesor | Crea una nueva asignación. |
| `PATCH` | `/api/assignments/:id` | Profesor | Edita una asignación existente. |
| `DELETE` | `/api/assignments/:id` | Profesor | Elimina una asignación. |
| `POST` | `/api/assignments/:id/submit` | Estudiante | Entrega/completa una asignación propia; dispara recompensas (monedas, stats del Pancho). |

### 4.4 Seguridad transversal a implementar

- **`helmet`:** middleware global en Express (`app.use(helmet())`) para cabeceras HTTP seguras por defecto (CSP, `X-Content-Type-Options`, etc.).
- **Protección contra inyección NoSQL:** sanitizar `req.body`, `req.query` y `req.params` (p. ej. con `express-mongo-sanitize`) antes de construir cualquier query de Mongoose, para neutralizar operadores (`$gt`, `$ne`, etc.) inyectados desde el cliente.
- **Protección contra XSS:** validar y escapar cualquier texto libre que el usuario ingrese (nombre del Pancho, respuestas de asignaciones) tanto al guardarlo como al renderizarlo; nunca usar `dangerouslySetInnerHTML` en el frontend con datos de usuario sin sanitizar.
- **JWT:** firmar con un secreto fuerte desde variable de entorno, expiración corta + estrategia de refresh si aplica, y middleware `authenticate` + `authorize(role)` reutilizable en todas las rutas privadas.
- **CORS:** restringido explícitamente al dominio del frontend desplegado.
- **Validación de entrada:** esquema por endpoint (`zod`/`joi`/`express-validator`) antes de tocar la base de datos.

---

## 5. Instrucciones para Ejecución Local y Despliegue

### 5.1 Frontend (Fase 1 — vigente hoy)

**Requisitos:** Node.js 18+ y npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo (http://localhost:5173)
npm run dev

# 3. Generar el build de producción (carpeta dist/)
npm run build

# 4. Previsualizar ese build localmente
npm run preview
```

**Despliegue actual (GitHub Pages):**

```bash
npm run deploy
```

Este comando ejecuta `predeploy` (build + genera `dist/404.html` a partir de `dist/index.html`, necesario para que las rutas internas de React Router no den 404 al recargar) y luego publica la carpeta `dist/` en la rama `gh-pages` mediante el paquete `gh-pages`. La configuración relevante:

- `vite.config.js`: `base: "/Panchoracle-v.2/"`.
- `src/main.jsx`: `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
- GitHub → Settings → Pages → Source: `Deploy from a branch`, rama `gh-pages`, carpeta `/ (root)`.

Sitio: `https://Niculazo11.github.io/Panchoracle-v.2/`.

### 5.2 Backend y despliegue Full Stack en Vercel (Fase 2 — pendiente)

Esta subsección es una plantilla a completar cuando el backend exista:

```bash
# Dentro de la futura carpeta del servidor (p. ej. /server)
npm install
cp .env.example .env   # definir MONGODB_URI, JWT_SECRET, PORT, etc.
npm run dev            # servidor local, p. ej. http://localhost:4000
```

Variables de entorno mínimas a definir (no commitear `.env`):

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión a MongoDB Atlas. |
| `JWT_SECRET` | Secreto para firmar/verificar tokens. |
| `CORS_ORIGIN` | Dominio del frontend permitido. |

Pasos pendientes de decidir y documentar cuando se implemente el despliegue:
1. Si el frontend migra de GitHub Pages a Vercel, o si Vercel aloja solo la API y GitHub Pages sigue sirviendo el frontend.
2. Configuración del proyecto en Vercel (`vercel.json` si hace falta, variables de entorno en el dashboard de Vercel, no en el repo).
3. URL final de entrega, a reemplazar aquí una vez desplegado.

---

## 6. Política de Actualización del Documento (obligatoria)

Este archivo es un **documento vivo**, no una foto fija tomada una sola vez. Su valor depende de que siga reflejando el estado real del código en todo momento, así que aplica la siguiente regla sin excepción:

> **Toda modificación al proyecto (de código, configuración o despliegue) debe venir acompañada de una actualización de este `.md` en el mismo commit o pull request.** Un cambio no se considera terminado hasta que el documento esté al día.

Para que el seguimiento sea automático y cualquiera (incluido el profesor, en la defensa oral) pueda ver de un vistazo qué avanzó y qué falta, cada cambio debe:

1. **Actualizar el estado del requisito afectado** en las tablas de las secciones 2.1 y 2.2, usando siempre uno de estos tres marcadores:
   - ✅ **Hecho** — implementado, probado y verificado contra el código real (no contra la intención).
   - 🟡 **En proceso** — se empezó a construir, pero no cumple aún el requisito completo (por ejemplo, el endpoint existe pero no valida el rol, o el JWT se emite pero no se verifica en el middleware).
   - 🔲 **Planeado** — todavía no hay código para eso.
   
   Nunca dejar un ítem marcado ✅ si el código no lo respalda: es preferible marcarlo 🟡 y explicar qué falta, que declarar algo terminado antes de tiempo.

2. **Agregar una entrada en la Bitácora (sección 7)** por cada cambio relevante de arquitectura, endpoints, roles/permisos, seguridad o despliegue, con el formato de la tabla: fecha, autor, cambio y estado alcanzado (🔲→🟡, 🟡→✅, etc.).

3. **Mover el detalle real** de la sección 2.2 (plan) a donde corresponda una vez implementado: si un endpoint pasa de planeado a hecho, su fila deja de ser "a implementar" y pasa a documentar la ruta, el rol y el comportamiento reales (incluyendo casos de error), igual que ya se hizo con las rutas de la Fase 1 en la sección 2.1.1.

4. **Revisar las advertencias de "no implementado todavía"** (como la de la sección 4) y eliminarlas apenas el primer endpoint real exista, reemplazándolas por la documentación del endpoint concreto.

El objetivo es que, leyendo solo este archivo, se pueda saber en cualquier momento qué partes del proyecto son reales hoy y cuáles siguen siendo plan, sin tener que leer el código para confirmarlo.

---

## 7. Bitácora de Mantenimiento Futuro

> Agregar una entrada por cada cambio relevante de arquitectura, despliegue o seguridad, siguiendo la política de la sección 6. Formato sugerido: fecha, autor, resumen, impacto y estado.

| Fecha | Autor | Cambio | Impacto | Estado |
|---|---|---|---|---|
| 2026-10-05 | Claude (asistido) | Unificación de estilos hacia Tailwind CSS: se eliminó el CSS plano inyectado en `AboutUs` (`about/styles/*.js`, `usePageStyles.js`) y se reescribieron `AboutNav/Hero/Team/Project/FaqSection` en Tailwind puro; `PanchoStatusBanner` migró sus colores hex y `@keyframes` a `tailwind.config.js`. | Sección 2.1.2 actualizada (hook `usePageStyles` ya no existe). Ningún cambio visual ni funcional para el usuario. | ✅ Hecho |
| 2026-10-05 | Claude (asistido) | Saneamiento del repositorio: se eliminaron `_bmad/` y el archivo suelto `"tash push -m..."` (ambos trackeados en git). Se corrigió además un bug de despliegue propio de una sesión anterior: los fondos de `RaisePancho` y `PanchoStats` usaban rutas absolutas (`bg-[url('/images/...')]`) que se rompían bajo el subdirectorio de GitHub Pages. | Repositorio sin archivos de herramientas ajenas al proyecto. Fondos de esas dos páginas ahora sí cargan en el sitio publicado. | ✅ Hecho |
| 2026-10-05 | Claude (asistido) | Optimización de re-renders y limpieza de dependencias: `GameStateContext` memoiza el valor del contexto (`useMemo`) en vez de reconstruirlo en cada render; se corrigieron los 8 `useEffect` que tenían `eslint-disable react-hooks/exhaustive-deps`, agregando las dependencias reales donde era seguro hacerlo. | Menos renders innecesarios en todos los consumidores de `useGameState()`. Código sin advertencias de lint silenciadas. | ✅ Hecho |
| 2026-10-05 | Claude (asistido) | Nueva sección de Mini Juegos: quiz funcional (`src/pages/minigames/`) integrado en la ruta ya existente `/minigames`, con nueva acción `awardMinigameCoins` en `state/actions/minigames.js` que otorga monedas (hasta el tope ya documentado en la FAQ: +5 por minijuego). | Sección 2.1.3 (nueva) documenta el flujo. Sigue siendo 100% frontend/`localStorage` (Fase 1); no toca nada de la Fase 2. | ✅ Hecho |
| | | | | |

