import { Navigate, useLocation } from "react-router-dom";
import { useAccess } from "../lib/useAccess.js";

// Container route guard: reads the access flag (localStorage, exposed as
// a global store by lib/auth.js) and sends anyone without permission to
// the login page. The whole location object travels in the navigation
// state as `from`, so Login can send the user back to the page they
// originally asked for (including its query string). `replace` keeps the
// blocked page out of the history stack.
export default function ProtectedRoute({ children, redirectTo = "/login" }) {
    const allowed = useAccess();
    const location = useLocation();

    if (!allowed) {
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
