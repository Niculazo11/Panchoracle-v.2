import { useContext } from "react";
import { AccessContext } from "./AccessContext.jsx";

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) throw new Error("useAccess debe usarse dentro de <AccessProvider>");
  return context;
}