import { Navigate } from "react-router-dom";
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
  { paths: ["/teachersPark", "/teachersPark.html"], element: <TeachersPark /> },
];

export const LEGACY_REDIRECTS = [
  { from: ["/dogpark", "/dogPark.html"], to: "/teachersPark" },
];

export function renderRoutes(routes, wrapper) {
  return routes.flatMap(({ paths, element }) =>
    paths.map((path) => (
      <wrapper key={path} path={path} element={element} />
    ))
  );
}

export const ABOUT_PATHS = PUBLIC_ROUTES.find((r) => r.element.type === AboutUs).paths;
export const TEACHERS_PARK_PATHS = PRIVATE_ROUTES.find((r) => r.element.type === TeachersPark).paths;