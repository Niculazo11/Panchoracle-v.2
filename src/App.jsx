import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAccess } from "./lib/useAccess.js";
import HomeHeader from "./pages/home/HomeHeader.jsx";
import { renderRoutes, PRIVATE_ROUTES, PUBLIC_ROUTES, LEGACY_REDIRECTS } from "./routes/routesConfig.js";
import { useNavbarVisibility } from "./hooks/useNavbarVisibility.js";

export default function App() {
  const showNavbar = useNavbarVisibility();

  return (
    <>
      {showNavbar && <HomeHeader />}
      <Routes>
        {renderRoutes(PUBLIC_ROUTES)}
        {renderRoutes(PRIVATE_ROUTES, (element) => (
          <Route element={<ProtectedRoute>{element}</ProtectedRoute>} />
        ))}
        {LEGACY_REDIRECTS.map(({ from, to }) =>
          from.map((path) => (
            <Route key={path} path={path} element={<Navigate replace to={to} />} />
          ))
        )}
      </Routes>
    </>
  );
}