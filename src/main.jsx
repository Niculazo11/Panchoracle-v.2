import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { GameStateProvider } from "./state/GameStateContext.jsx";
import "./index.css";
import { revokeAccess } from "./lib/auth.js";
import { AUTH_EXPIRED_EVENT } from "./lib/api.js";

// RF-6 (UN-201): un 401 de la API cierra la sesión del cliente;
// ProtectedRoute redirige a /login.
window.addEventListener(AUTH_EXPIRED_EVENT, revokeAccess);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GameStateProvider>
        <App />
      </GameStateProvider>
    </BrowserRouter>
  </React.StrictMode>
);
