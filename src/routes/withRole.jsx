import { Navigate, useLocation } from "react-router-dom";
import { useAccess } from "../lib/useAccess.js";

export function withRole(allowedRoles) {
  return function WithRoleWrapper({ children }) {
    const { status, role } = useAccess();
    const location = useLocation();

    if (status === "checking") {
      return null;
    }

    if (status !== "authenticated" || !allowedRoles.includes(role)) {
      return (
        <Navigate
          replace
          to="/login"
          state={{ from: location }}
        />
      );
    }

    return children;
  };
}