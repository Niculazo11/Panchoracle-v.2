# usePolling Hook — Documentación Técnica (UN-305)

> Documento preparado para la defensa oral M2 (UN-608). Explica el diseño del hook `usePolling`, su dependency array, el cleanup y cuándo se ejecuta.

---

## 1. Propósito

`usePolling` es un hook reutilizable que mantiene el estado del cliente sincronizado con el servidor mediante **polling periódico** y **refresco al volver el foco a la pestaña**. Sustituye el `setInterval` manual que existía en `RaisePancho` y el listener `storage` de `PanchoStats`.

Se usa para:
- Recargar el estado del juego (`GET /api/me/game`) cada 15 s.
- Recargar al instante cuando el usuario vuelve a la pestaña (`visibilitychange` + `focus`).
- Evitar pisar una mutación en curso (compra, equipar, completar paso, etc.).

---

## 2. Firma y Parámetros

```ts
function usePolling(
  fetchFn: () => Promise<void>,
  options?: {
    intervalMs?: number;   // default 15000
    enabled?: boolean;     // default true
  }
): { refresh: () => void }
```

- `fetchFn`: función async que hace el fetch y actualiza el store local (p. ej. `init` de `GameStateContext`).
- `intervalMs`: intervalo de polling en ms.
- `enabled`: permite activar/desactivar el polling sin desmontar el hook.
- Devuelve `refresh()` para forzar una recarga inmediata (p. ej. tras una mutación exitosa).

---

## 3. Qué Dispara el Efecto (Dependency Array)

Hay **dos `useEffect` independientes**, cada uno con su propio dependency array:

### 3.1 Efecto de Polling Periódico

```js
useEffect(() => {
  if (!enabled) return;

  const tick = () => { doFetch(); };

  tick();                    // ejecución inmediata al montar / al cambiar enabled/intervalMs
  intervalRef.current = window.setInterval(tick, intervalMs);

  return () => {             // cleanup
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  };
}, [doFetch, intervalMs, enabled]);
```

**Dependency array:** `[doFetch, intervalMs, enabled]`

- `doFetch`: **estable** gracias a `useCallback` con deps `[]` (cierra sobre `fetchRef.current` y `enabledRef.current`).
- `intervalMs`: si cambia, se limpia el timer viejo y se crea uno nuevo con el nuevo intervalo.
- `enabled`: si pasa a `false`, el cleanup limpia el timer; si vuelve a `true`, se rearma.

> **Por qué no está `fetchFn` en el array:** `fetchFn` cambia en cada render si el padre no lo memoiza. Para evitar rearme innecesario, guardamos la última versión en `fetchRef.current` y `doFetch` lee de ahí. Así el efecto solo se rearma cuando cambian `intervalMs` o `enabled`.

### 3.2 Efecto de Refresco por Foco/Visibilidad

```js
useEffect(() => {
  if (!enabled) return;

  const onVisibilityChange = () => { if (!document.hidden) doFetch(); };
  const onFocus = () => { doFetch(); };

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("focus", onFocus);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
  };
}, [doFetch, enabled]);
```

**Dependency array:** `[doFetch, enabled]`

- Mismos principios: `doFetch` es estable, `enabled` activa/desactiva los listeners.
- `visibilitychange` detecta cuando la pestaña vuelve a ser visible (incluye móvil).
- `focus` cubre el caso de volver al navegador desde otra app (desktop).

---

## 4. Cleanup Real (Timers y Listeners)

Ambos efectos devuelven una **función de limpieza** que se ejecuta:
- Al desmontar el componente.
- Antes de volver a ejecutar el efecto (cuando cambia una dependencia).

### Limpieza del timer
```js
return () => {
  if (intervalRef.current) {
    window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
};
```
- `clearInterval` evita fugas de memoria y callbacks zombis.
- `intervalRef.current = null` previene dobles limpiezas.

### Limpieza de listeners DOM
```js
return () => {
  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("focus", onFocus);
};
```
- `removeEventListener` con la **misma referencia de función** que se pasó a `addEventListener` (guardada en variable de closure).
- Sin esto, los listeners se acumularían en cada re-render que cambie `enabled`.

---

## 5. Protección contra Pisada de Mutaciones (RNF-3)

```js
const doFetch = useCallback(async () => {
  if (!enabledRef.current || isFetchingRef.current) return;
  isFetchingRef.current = true;
  try {
    await fetchRef.current();
  } finally {
    isFetchingRef.current = false;
  }
}, []);
```

- `isFetchingRef.current` es un **mutex** a nivel de hook.
- Si el usuario está comprando/equipando/completando paso, la mutación llama a `fetchFn` (p. ej. `init`) **después** de la respuesta del servidor.
- Mientras `isFetchingRef.current === true`, el polling y el foco **no** disparan una nueva carga.
- Esto evita *race conditions* donde una recarga automática sobrescriba el estado optimista que el servidor acaba de confirmar.

---

## 6. Cuándo Corre (Ciclo de Vida)

| Momento | Qué ocurre |
|---------|------------|
| **Montaje** | `tick()` inmediato → primer fetch. Timer arranca. Listeners `visibilitychange`/`focus` se registran. |
| **Cada `intervalMs`** | `tick()` → `doFetch()` → si no hay mutación en curso, `fetchFn()` y actualiza store. |
| **Pestaña oculta → visible** | `visibilitychange` → `doFetch()` → recarga inmediata. |
| **Ventana enfocada** | `focus` → `doFetch()` → recarga inmediata (redundante con visibility, pero seguro en desktop). |
| **Mutación exitosa** | Componente llama a `refresh()` → `doFetch()` inmediato (fuera del intervalo). |
| **`enabled: false`** | Cleanup: timer parado, listeners removidos. Sin fetches. |
| **`enabled: true`** | Re-arma: timer nuevo, listeners nuevos, `tick()` inmediato. |
| **Desmontaje** | Cleanup final: timer parado, listeners removidos. |

---

## 7. Uso Actual en el Proyecto

### RaisePancho.jsx (estudiante)
```js
const { refresh } = usePolling(init, { intervalMs: 15000, enabled: true });
```
- `init` = `fetchGameState()` + `store.setState()`.
- Polling cada 15 s + refresco al volver a la pestaña.
- `DeadNotice` y `StatusBars` reflejan hambre/salud del servidor sin recarga manual.

### PanchoStats.jsx (perfil público)
```js
const { refresh } = usePolling(init, { intervalMs: 15000, enabled: true });
```
- Misma lógica: el perfil de otro estudiante se mantiene fresco aunque la página esté abierta en segundo plano.

### TeachersPark (futuro, UN-403/UN-305 RF-3)
```js
const { refresh } = usePolling(fetchClassroomStudents, { intervalMs: 20000, enabled: true });
```
- Reutilizable: solo cambia `fetchFn` e `intervalMs`.
- El profesor ve actualizaciones de hambre/salud de sus alumnos en tiempo quasi-real.

---

## 8. Decisiones de Diseño y Trade-offs

| Decisión | Justificación |
|----------|---------------|
| **Polling, no WebSocket/SSE** | RNF-1: fuera de alcance. Polling es simple, funciona en cualquier hosting (incl. GitHub Pages + Vercel serverless), no requiere sticky sessions ni infra extra. |
| **15 s por defecto** | Equilibrio entre frescura (hambre decae cada ~15 s en servidor) y carga de red. Configurable por consumidor. |
| **Refs para `fetchFn` y `enabled`** | Evita que el efecto se rearme en cada render del padre. `doFetch` es estable (`useCallback([])`). |
| **Mutex `isFetchingRef`** | Previene pisar mutaciones sin añadir complejidad de colas o cancelación de requests. |
| **`visibilitychange` + `focus`** | `visibilitychange` cubre móvil y cambio de pestaña; `focus` cubre Alt-Tab en desktop. Juntos cubren todos los casos de "usuario vuelve a mirar". |
| **Cleanup síncrono en return** | Garantiza que no queden timers/listeners huérfanos aunque el componente se desmonte durante un fetch. |

---

## 9. Pruebas de Comportamiento (Verificación Manual)

1. **Polling periódico**: Abrir RaisePancho, esperar 15 s → consola muestra fetch a `/api/me/game`, barras se actualizan si el servidor cambió hambre.
2. **Refresco al foco**: Cambiar de pestaña, esperar 10 s, volver → fetch inmediato, estado fresco.
3. **No pisa mutación**: Click en "Comprar" → mientras `buyCosmetic` está en vuelo, no hay fetches de polling aunque pase el intervalo.
4. **Cleanup**: Navegar a otra ruta (p. ej. `/Shop`) → no hay errores en consola, no hay fetches fantasmas.
5. **Enabled toggle**: Pasar `enabled={false}` → polling se detiene; volver a `true` → rearma limpio.

---

## 10. Referencias

- ADR 001 §2.1, §5.3 — Estado del juego en servidor, hambre calculada en backend.
- UN-303 — Migración GameState a API (creó `init` y store que usa este hook).
- UN-608 — Defensa oral: este documento es el insumo escrito para la explicación del hook.

---

*Generado como parte de UN-305 — `usePolling` y sincronización de la sesión del estudiante.*