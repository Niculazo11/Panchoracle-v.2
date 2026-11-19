import { Navigate, Route } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import AboutUs from "../pages/AboutUs.jsx";
import ChoosePancho from "../pages/ChoosePancho.jsx";
import RaisePancho from "../pages/RaisePancho.jsx";
import PanchoStats from "../pages/PanchoStats.jsx";
import Shop from "../pages/Shop.jsx";
import CosmeticDetail from "../pages/CosmeticDetail.jsx";
import MiniGames from "../pages/MiniGames.jsx";
import TeachersPark from "../pages/teacherspark/TeachersPark.jsx";
import TeacherShell from "../pages/teacherspark/TeacherShell.jsx";
import NewClassroom from "../pages/teacherspark/NewClassroom.jsx";
import ClassroomSettings from "../pages/teacherspark/ClassroomSettings.jsx";
import ClassroomsPanel from "../pages/teacherspark/ClassroomsPanel.jsx";
import TeacherSection from "../pages/teacherspark/TeacherSection.jsx";
import {
  PARK_PATH, CLASSROOM_PATH, NEW_CLASSROOM_PATH, SETTINGS_PATH,
  HOMEWORK_PATH, SEARCH_PATH, MINIGAMES_PATH,
} from "../pages/teacherspark/teacherPaths.js";
import { withRole } from "./withRole.jsx";

export const PUBLIC_ROUTES = [
  { paths: ["/"], element: <Home /> },
  { paths: ["/login"], element: <Login /> },
  { paths: ["/aboutus", "/aboutus.html"], element: <AboutUs /> },
  { paths: ["/choose", "/choosePancho", "/choosePancho.html"], element: <ChoosePancho /> },
];

export const PRIVATE_ROUTES = [
  { paths: ["/raise", "/raisePancho", "/raisePancho.html"], element: <RaisePancho /> },
  { paths: ["/stats/:username", "/stats", "/panchoStats", "/panchoStats.html"], element: <PanchoStats /> },
  { paths: ["/shop", "/Shop", "/Shop.html"], element: <Shop /> },
  { paths: ["/Shop/:cosmeticId"], element: <CosmeticDetail /> },
  { paths: ["/minigames", "/MiniGames", "/MiniGames.html"], element: <MiniGames /> },
];

export const LEGACY_REDIRECTS = [
  { from: ["/dogpark", "/dogPark.html", "/teachersPark.html"], to: PARK_PATH },
];

export function renderRoutes(routes, defaultWrapper) {
  const result = [];

  for (let i = 0; i < routes.length; i++) {
    const { paths, element, wrapper } = routes[i];
    const Wrapper = wrapper || defaultWrapper;

    // Wrap the page in the wrapper component, if there is one.
    const content = Wrapper ? <Wrapper>{element}</Wrapper> : element;

    for (let j = 0; j < paths.length; j++) {
      result.push(<Route key={paths[j]} path={paths[j]} element={content} />);
    }
  }

  return result;
}

const TeacherOnly = withRole(["teacher"], "Only teachers can access this option.");

// Every teacher page lives under /teachersPark and shares TeacherShell
// (error banner, top bar and the check that the teacher has a classroom).
export function renderTeacherRoutes() {
  return (
    <Route path={PARK_PATH} element={<TeacherOnly><TeacherShell /></TeacherOnly>}>
      <Route index element={<ClassroomsPanel />} />
      <Route path="classroom" element={<TeachersPark />} />
      <Route path="newClassroom" element={<NewClassroom />} />
      <Route path="settings" element={<ClassroomSettings />} />
      <Route path="homework" element={<TeacherSection title="Manage Homework" />} />
      <Route path="search" element={<TeacherSection title="Search for a Dog" />} />
      <Route path="minigames" element={<TeacherSection title="Manage Minigames" />} />
    </Route>
  );
}

export const ABOUT_PATHS = PUBLIC_ROUTES.find((r) => r.element.type === AboutUs).paths;
// Pages of the teacher area: the home navbar is hidden on all of them.
export const TEACHERS_PARK_PATHS = [
  PARK_PATH, "/teachersPark.html", CLASSROOM_PATH, NEW_CLASSROOM_PATH, SETTINGS_PATH,
  HOMEWORK_PATH, SEARCH_PATH, MINIGAMES_PATH,
];