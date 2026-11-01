import { useLocation } from "react-router-dom";
import { ABOUT_PATHS, TEACHERS_PARK_PATHS } from "../routes/routesConfig.jsx";

export function useNavbarVisibility() {
  const { pathname } = useLocation();
  return !ABOUT_PATHS.includes(pathname) && !TEACHERS_PARK_PATHS.includes(pathname);
}