import { Navigate, useLocation } from "react-router-dom";
import { useAccess } from "../lib/useAccess.js";

export default function ProtectedRoute({ children, redirectTo = "/login" }) {
  const { status } = useAccess();
  const location = useLocation();

  if (status === "checking") {
    return null;
  }

  if (status !== "authenticated") {
    return (
      <Navigate
        replace
        to={redirectTo}
        state={{ from: location }}
      />
    );
  }

  return children;
}