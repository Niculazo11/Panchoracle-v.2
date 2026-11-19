import { useLocation } from "react-router-dom";
import { ABOUT_PATHS, TEACHERS_PARK_PATHS } from "../routes/routesConfig.jsx";
import { PARK_PATH } from "../pages/teacherspark/teacherPaths.js";

export function useNavbarVisibility() {
  const { pathname } = useLocation();
  // Every page under /teachersPark (also the ones with an id in the path) has its own bar.
  const inTeacherArea = TEACHERS_PARK_PATHS.includes(pathname) || pathname.startsWith(PARK_PATH + "/");
  return !ABOUT_PATHS.includes(pathname) && !inTeacherArea;
}