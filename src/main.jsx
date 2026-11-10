import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { GameStateProvider } from "./state/GameStateContext.jsx";
import "./index.css";
import { AccessProvider } from "./lib/AccessContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AccessProvider>
      <GameStateProvider>
        <App />
      </GameStateProvider>
      </AccessProvider>
    </BrowserRouter>
  </React.StrictMode>
);