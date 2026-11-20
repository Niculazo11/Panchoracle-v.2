# Bitácora Técnica y Log de Desarrollo — Panchoracle (`raise-a-pancho-react`)

**Fecha:** 19 de noviembre de 2026  
**Autor:** Nicolas Moreno Parra (`Niculazo11`)  
**Flujo de trabajo:** Gemini (Auditoría, arquitectura y prompts) + Claude (Ejecución de refactors y componentes)

---

## 1. Creación de Tickets (Backlog Inicial de la Sesión)

### Ticket `UN-501`: Eliminación de barras/pasos de tareas obsoletos y limpieza de código muerto
- **Tipo:** Refactor / Tech Debt
- **Descripción:** Remover los checkboxes y barras de progreso de 4 pasos de tareas legacy en la vista principal (`RaisePancho.jsx`), en el panel de estadísticas (`StatsPanel.jsx`) y en el estado global (`GameStateContext.jsx`, `defaults.js`, `actions/assignment.js`), centralizando la entrega de tareas únicamente en la vista de *Homework*.
- **Criterios de aceptación:**
  - `RaisePancho.jsx` muestra únicamente a Pancho sin barras de pasos obsoletas.
  - `npm run build` compila sin errores ni referencias a variables eliminadas.

### Ticket `UN-502`: Reparación de compilación en producción (Vercel) y exportación de API
- **Tipo:** Bugfix (Crítico)
- **Descripción:** Resolver el fallo de compilación de Vite/Rollup en Vercel causado por la corrupción de `src/lib/api.js` (auto-importación circular y pérdida de `api`, `ApiError` y `AUTH_EXPIRED_EVENT`).
- **Criterios de aceptación:**
  - `src/lib/api.js` restaurado desde el commit estable `49331fe`.
  - Deploy en Vercel en estado `Ready` apuntando al `HEAD` de `main`.

### Ticket `UN-503`: Corrección del flujo de registro (`Teacher` / `Student`) en Home
- **Tipo:** Bugfix (UI / Auth)
- **Descripción:** Hacer que los botones **Teacher** y **Student** en `JoinSection.jsx` disparen la validación y el envío del formulario de registro en `useJoinForm.js`.
- **Criterios de aceptación:**
  - Hacer clic en **Teacher** o **Student** valida los campos y ejecuta `register()` con el rol seleccionado.

### Ticket `UN-504`: Restauración de la vista de estadísticas (`PanchoStats.jsx` y `StatsPanel.jsx`)
- **Tipo:** Bugfix (UI / Render)
- **Descripción:** Corregir la pantalla en blanco en `/stats/:username` provocada por `ReferenceError: barWidth is not defined`, props pasados como strings (`"{dog}"`) y falta de optional chaining (`?.`).
- **Criterios de aceptación:**
  - La ruta `/stats/:username` renderiza correctamente Hunger, Health, Tasks completed y Current coins sin errores en consola.

### Ticket `UN-505`: Vista histórica de entregas por estudiante en `TeachersPark`
- **Tipo:** Feature
- **Descripción:** Actualizar la vista de detalle del estudiante en `src/pages/teacherspark/` para que el botón **"View Details"** muestre el historial cronológico completo de todas las tareas entregadas por ese alumno.
- **Criterios de aceptación:**
  - Muestra título de la tarea, fecha de entrega, nota/estado y enlace o archivo adjunto, incluyendo estados de carga y lista vacía.

---

## 2. Log Cronológico de Interacciones (Usuario, Gemini y Claude)

### Bloque 1: Validación de estado en `RaisePancho.jsx` y `PanchoStats.jsx`
- **Nicolas preguntó / ejecutó:**
  > `git status -sb` y `grep -n "imgUrl" src/pages/RaisePancho.jsx src/pages/PanchoStats.jsx` para verificar si los cambios ya estaban en `main` y revisar las referencias a `imgUrl`.
- **Gemini respondió:**
  > Confirmó que `main...origin/main` estaba sincronizado con el arreglo en `RaisePancho.jsx` y recomendó hacer **Redeploy** en Vercel sin caché. Además, advirtió que `PanchoStats.jsx` seguía teniendo `dog.imgUrl` y `student.id` sin optional chaining (`?.`) en las líneas 22–36.
- **Claude ejecutó / debió responder:**
  > *"He revisado `RaisePancho.jsx` y el renderizado condicional con `dog?.imgUrl` ya evita el `TypeError` inicial. Para cerrar el ticket `UN-504`, voy a aplicar el mismo patrón de optional chaining en `PanchoStats.jsx` y limpiar las props literales antes de ejecutar `vite build`."*

---

### Bloque 2: Impacto del Redeploy en el equipo de trabajo
- **Nicolas preguntó:**
  > *"¿Afecta a los que estén codificando?"*
- **Gemini respondió:**
  > Aclaró que el **Redeploy** ocurre únicamente en los servidores de Vercel tomando lo que ya existe en `origin/main`, sin tocar repositorios locales ni interrumpir el tráfico mientras compila. Indicó que el equipo solo debe hacer `git pull origin main` antes de subir nuevos commits.
- **Claude ejecutó / debió responder:**
  > *"No afecta el trabajo local de tus compañeros. Vercel aísla cada build en sus propios contenedores y mantiene activa la versión anterior hasta que el nuevo despliegue pasa a `Ready`. Solo asegúrate de avisarles que hagan `git pull` cuando subamos el fix de `api.js`."*

---

### Bloque 3: Diagnóstico del fallo de compilación en Vercel (`Error 6s`)
- **Nicolas preguntó / reportó:**
  > *"Le di redeploy pero se devolvió a una versión re anterior!!!"* y adjuntó la captura del panel de Deployments de Vercel donde los commits `bc31762`, `9568945`, `d0b23ca` y `30eec79` aparecían con `Error 6s` mientras `2BvXzRWBg` (*"Minigame's grades"*) estaba en `Ready`. Luego ejecutó `npm install` y `npm run build`, obteniendo `[MISSING_EXPORT] "api" is not exported by "src/lib/api.js"`.
- **Gemini respondió:**
  > Explicó que Vercel nunca reemplaza producción con un build fallido y que darle Redeploy a una fila vieja recompila ese hash antiguo. Al ver el error de `npm run build`, identificó que `src/lib/api.js` se estaba importando a sí mismo y dio el comando exacto para restaurarlo desde el último commit sano (`git checkout 49331fe -- src/lib/api.js`).
- **Claude ejecutó / debió responder:**
  > *"Detecté una importación circular en `src/lib/api.js` (`import { api } from './api.js'`) que rompe la resolución de módulos en Rollup/Vite para `AccessContext.jsx`, `gameApi.js` y `useConfirmPancho.js`. Restaurando `src/lib/api.js` desde el commit `49331fe` y ejecutando `npm run build` debería quedar resuelto el ticket `UN-502`."*

---

### Bloque 4: Optimización de prompt para `TeachersPark` (`View Details`)
- **Nicolas preguntó:**
  > *"¿Me podrías mejorar este prompt: Task: Update student detail view in teachersPark/students. Requirement: Clicking the 'View Details' button must display a complete list of all historical assignments the selected student has ever submitted.?"*
- **Gemini respondió:**
  > Entregó dos versiones optimizadas (una detallada y otra compacta) especificando ruta (`src/pages/teacherspark/`), orden cronológico, campos (`submittedAt`, título, nota/estado, archivo/enlace), estados de carga/vacío con Tailwind y restricción de alcance para no alterar la mecánica de salud/hambre de Pancho.
- **Claude ejecutó / debió responder:**
  > *"Entendido. Implementaré la vista de historial completo dentro de `src/pages/teacherspark/` conectada al botón 'View Details'. Incluiré un estado de carga, manejo de lista vacía y el listado cronológico con fecha, calificación y enlace de entrega respetando los estilos actuales de Tailwind y modo oscuro, sin tocar la lógica de `GameStateContext`."*

---

### Bloque 5: Limpieza de archivo residual en el directorio de trabajo
- **Nicolas preguntó:**
  > *"¿Puedo borrar este archivo?"* (adjuntando captura de un archivo con la salida cruda de `git log` y códigos ANSI `ESC[33m`).
- **Gemini respondió:**
  > Confirmó que era un archivo de texto generado accidentalmente al redirigir la salida de `git log` y que podía eliminarse de forma segura antes de hacer `git add .`.
- **Claude ejecutó / debió responder:**
  > *"Sí, ese archivo es solo una captura en texto plano de la salida de consola de Git con secuencias de escape ANSI. Puedes eliminarlo con `rm` para mantener limpio el árbol de trabajo antes del commit."*

---

### Bloque 6: Reparación de los botones `Teacher` y `Student` en el registro
- **Nicolas preguntó:**
  > *"No me están sirviendo los botones de student ni de teacher. ¿A qué se puede deber?"* y compartió `Login.jsx`, el `grep` en `src/pages/`, `JoinSection.jsx` y `useJoinForm.js`.
- **Gemini respondió:**
  > Identificó que los botones estaban en `src/pages/home/JoinSection.jsx` (registro) y que en `useJoinForm.js` la función `handleJoin(role)` únicamente actualizaba el estado (`setFormData`) sin disparar la validación ni el envío (`register`). Entregó el reemplazo completo de `useJoinForm.js` con `submitWithRole(selectedRole)`.
- **Claude ejecutó / debió responder:**
  > *"El problema en `src/pages/home/useJoinForm.js` es que `handleJoin` actualiza `formData.role` de forma asíncrona pero nunca invoca el envío del formulario, y los botones en `JoinSection.jsx` son `type='button'`. Refactoricé el hook introduciendo `submitWithRole(selectedRole)` para validar los campos de forma síncrona y llamar directamente a `register()` con el rol elegido."*

---

### Bloque 7: Pantalla en blanco en `PanchoStats.jsx` y `StatsPanel.jsx`
- **Nicolas preguntó:**
  > *"La parte de stats ya no está, se ve en blanco. ¿Es por lo que hicimos verdad?"* y compartió `PanchoStats.jsx` y `StatsPanel.jsx`. Luego reportó que le salían líneas en rojo en `PanchoStats.jsx` al editarlo.
- **Gemini respondió:**
  > Confirmó las tres causas del fallo en tiempo de ejecución:
  > 1. `ReferenceError: barWidth is not defined` en `StatsPanel.jsx` tras eliminar la barra de 4 pasos.
  > 2. Props pasados como cadenas de texto (`dog="{dog}" student="{student}"`) en `PanchoStats.jsx`.
  > 3. Falta de optional chaining (`dog?.imgUrl`, `student?.id`).
  > Entregó los comandos `cat << 'EOF'` para escribir ambos archivos limpios desde terminal sin errores de sintaxis.
- **Claude ejecutó / debió responder:**
  > *"Al eliminar la lógica de pasos de tareas quedó huérfana la variable `barWidth` en `StatsPanel.jsx`, lo que provocaba un `ReferenceError` en tiempo de renderizado y dejaba la pantalla en blanco. Además, corregí en `PanchoStats.jsx` el paso de props (`dog={dog}` sin comillas) y añadí optional chaining (`?.`) para evitar fallos mientras `usePolling` hidrata el estado."*

---

## 3. Estado Final de Verificación
- **Archivos clave saneados:**
  - `src/lib/api.js` (restaurado desde `49331fe`)
  - `src/pages/home/useJoinForm.js` (envío directo por rol en `Teacher` / `Student`)
  - `src/pages/PanchoStats.jsx` (optional chaining y props corregidos)
  - `src/pages/stats/StatsPanel.jsx` (eliminación de referencia rota a `barWidth`)
- **Siguiente paso:** Ejecutar `npm run build` para confirmar compilación limpia y hacer `git push origin main` para desplegar en Vercel.