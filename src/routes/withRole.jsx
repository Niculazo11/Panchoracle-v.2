import { Navigate, useLocation } from "react-router-dom";
import { useAccess } from "../lib/useAccess.js";
import AccessDenied from "./AccessDenied.jsx";

export function withRole(allowedRoles, deniedMessage = "You do not have access to this option.") {
  return function WithRoleWrapper({ children }) {
    const { status, role } = useAccess();
    const location = useLocation();

    if (status === "checking") {
      return null;
    }

    if (status !== "authenticated") {
      return (
        <Navigate
          replace
          to="/login"
          state={{ from: location }}
        />
      );
    }

    // Logged in with the wrong role: say so instead of bouncing through /login -> /raise.
    if (!allowedRoles.includes(role)) {
      return <AccessDenied message={deniedMessage} />;
    }

    return children;
  };
}