# Retroalimentación de Entrega Final — Panchoracle v.2

## 1. Qué quedó pendiente (Fuera de alcance en esta entrega)

* **Pantalla final de resultados del quiz (`QuizResult.jsx`):** El estudiante ve una notificación rápida al terminar, pero no permanece en una pantalla dedicada con el desglose de aciertos y botón explícito para reclamar monedas o reintentar.
* **Catálogo ampliado de minijuegos:** Solo se implementó el modo **Quiz** (personalizado por el profesor o banco general); los demás minijuegos del diseño quedaron en estado pendiente.
* **Gestión de múltiples quizzes y analítica por pregunta:** Cada salón soporta un único quiz activo a la vez y el profesor no visualiza métricas sobre qué preguntas fallan más los estudiantes.
* **Arte e iconografía definitiva en ciertas vistas:** Persisten marcadores provisionales en algunos íconos de navegación del profesor y miniaturas de minijuegos.
* **Unificación total de idioma y zona horaria local:** La interfaz está en inglés, pero algunos errores de validación del backend siguen llegando en español, y el límite diario de minijuegos se reinicia bajo horario UTC en lugar de hora Colombia (`UTC-5`).
* **Borrado en cascada completo al eliminar salones:** Al borrar un salón quedan registros huérfanos de quizzes o partidas históricas en la base de datos.
* **Suite automatizada de pruebas e integración continua (CI):** Las validaciones se realizaron de forma manual sin pipelines automáticos de tests en cada pull request.

---

## 2. Cómo se habría resuelto cada punto con más tiempo

* **Pantalla de resultado del quiz:** Desacoplar el cierre del componente en `MiniGames.jsx` para que `useQuiz` guarde el puntaje final en estado y renderice `QuizResult.jsx`, ejecutando `onComplete` únicamente cuando el usuario presione *"Claim coins"* o *"Back"*.
* **Segundo minijuego y multi-quiz:** Crear un registro de estrategias por `gameId` en el backend (evitando condicionales fijos) y cambiar la relación `Classroom -> Quiz` de 1:1 a 1:N con un campo `isActive` para que el profesor pueda activar, archivar o duplicar cuestionarios.
* **Reinicio diario en hora local y manejo de errores:** Sustituir `setUTCHours(0, 0, 0, 0)` por una ventana móvil de 24 horas o cálculo con `America/Bogota` (`UTC-5`), y estandarizar un diccionario único de mensajes de error en inglés en los esquemas de validación del servidor.
* **Integridad referencial en MongoDB:** Implementar *hooks* `pre('deleteOne')` en Mongoose o transacciones en el servicio de salones para eliminar en cascada tareas, entregas, quizzes y partidas asociadas al `classroomId`.
* **Calidad y despliegue continuo:** Añadir un workflow de GitHub Actions que ejecute `npm run build` y pruebas de integración con Vitest/Supertest antes de permitir el *merge* a `main`, evitando desplegar commits con errores de compilación en Vercel.