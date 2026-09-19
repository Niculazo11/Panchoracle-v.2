# Cambios implementados

Sin tocar estilos, clases Tailwind ni maquetación. Ningún archivo supera 80 líneas.

## 1. Bloqueo de formulario y validaciones
- `src/lib/validation.js`: regla compleja de correo con `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  (antes sólo comprobaba `includes("@")`) y regla de coincidencia entre
  contraseña y confirmación. `hasErrors(errors)` detecta errores activos.
- `src/lib/formValidators.js`: valida el formulario completo y devuelve un
  objeto `errors` con la misma forma que `formData`.
- `handleSubmit` en `pages/home/useJoinForm.js`, `pages/login/useLoginForm.js` y
  `pages/choose/useConfirmPancho.js`: valida todos los campos, y si hay al menos
  un error llama `event.preventDefault()` y hace `return` (en ChoosePancho eso
  bloquea la navegación del enlace de la patita).
- Errores inline por campo mediante `components/FormField.jsx` (mismo markup,
  mismos `id` y clases que antes; el mensaje sólo se muestra si existe).
- `formData` y `errors` se limpian sólo tras un envío totalmente exitoso.

## 2. Consumo asíncrono con cleanup
- `src/lib/useDogImages.js`: `new AbortController()`, `fetch(url, { signal })`
  (en `lib/dogApi.js`) y `return () => controller.abort()` en el cleanup del
  `useEffect`. Estados de carga, éxito y error (+ offline) expuestos al
  componente y reflejados en el banner de `ChoosePancho`.

## 3. Persistencia de favoritos
- `src/lib/favorites.js` + `src/lib/useFavorites.js`: estado inicial leído de
  localStorage y `useEffect` que lo guarda en cada cambio (clave por usuario).
- Botón de estrella en cada cosmético del Shop (`pages/shop/FavoriteButton.jsx`).

## 4. Protección de rutas
- `src/components/ProtectedRoute.jsx`: lee la bandera de acceso
  (`lib/auth.js`, expuesta como store global) y redirige con
  `<Navigate replace to="/login" />`.
- `App.jsx` protege raisePancho, panchoStats, Shop y MiniGames.
- Nueva página `/login` (`pages/Login.jsx`); el acceso se concede también al
  completar el formulario de Home o confirmar el Pancho.

## 5. Modularidad
Páginas y estado divididos en subcomponentes y módulos pequeños
(`pages/home`, `pages/about`, `pages/choose`, `pages/raise`, `pages/shop`,
`pages/stats`, `state/actions`, etc.). La lógica de `gameState.js` es la misma:
sólo cambió de archivo.

---

# Segunda iteración (auditoría)

## Inmutabilidad del estado
- `state/actions/*.js`: cada acción devuelve `{ success, state }` con un objeto
  nuevo (`...state`, `...state.dog`, `[...inventory]`, `steps.map(...)`). Ya no
  se muta nada en el estado previo.
- `GameStateBase._run()` sustituye la referencia del snapshot. Esto además
  arregla un bug latente: `useSyncExternalStore` descarta el render cuando el
  snapshot es el mismo objeto, así que mutar en sitio podía no repintar la UI.
- `defaults.normalizeState()` reconstruye el objeto en vez de parchear el
  parseado.
- Nota: `student.inventory` sigue guardando ids (no objetos completos) porque
  es la forma que consumen `dataset.json`, el Shop y `equippedCosmetics`.

## Robustez de almacenamiento
- `state/storage.js`, `lib/dogStorage.js`, `lib/dogApi.js` y `lib/auth.js`:
  todas las lecturas y escrituras de `localStorage` van en `try...catch`.
  Ante fallo o dato corrupto se cae a `defaults.js` y el juego sigue en memoria.

## Rutas y autenticación
- `App.jsx`: tablas `PUBLIC_ROUTES` / `PRIVATE_ROUTES`. Se añaden `/raise`,
  `/stats`, `/shop`, `/minigames` y `/choose` junto a los paths `.html`
  originales. Todas las privadas se envuelven con `<ProtectedRoute>`.
- `/choose` queda pública a propósito: es donde se crea la cuenta, protegerla
  dejaría a un usuario nuevo sin forma de entrar.
- `ProtectedRoute.jsx` guarda `state: { from: location }` (objeto completo) y
  `useLoginForm.js` vuelve a `from.pathname + from.search` tras el login.
- `AssignmentPanel.jsx` ya despachaba vía `GameStateContext`
  (`completeStep` / `submitAssignment`); no toca estado local ni global.

## UI / Tailwind
- `tailwind.config.js`: keyframes `bounceShort`, `coinPop`, `statPulse` con las
  animaciones `bounce-short`, `coin-pop`, `stat-pulse`.
- `lib/useChangeFlash.js` activa la clase sólo cuando el valor cambia:
  monedas (Shop y dashboard), barras de hambre/salud y rebote de Pancho al
  recuperar hambre.
- Responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, paddings
  `px-4 sm:px-6` y contenedores de Pancho escalados para móvil.
