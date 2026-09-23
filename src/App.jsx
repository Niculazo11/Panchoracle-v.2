import { Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import ChoosePancho from "./pages/ChoosePancho.jsx";
import RaisePancho from "./pages/RaisePancho.jsx";
import PanchoStats from "./pages/PanchoStats.jsx";
import Shop from "./pages/Shop.jsx";
import MiniGames from "./pages/MiniGames.jsx";
import HomeHeader from "./pages/home/HomeHeader.jsx";

// Every page is reachable both through its original .html path (so the
// links migrated from the static site keep working) and through a short,
// clean path.
const PUBLIC_ROUTES = [
    { paths: ["/"], element: <Home /> },
    { paths: ["/login"], element: <Login /> },
    { paths: ["/aboutus", "/aboutus.html"], element: <AboutUs /> },
    // Adoption is the entry point of the game: it is what creates the
    // account, so it cannot sit behind the login guard.
    { paths: ["/choose", "/choosePancho", "/choosePancho.html"], element: <ChoosePancho /> }
];

// Everything that needs an adopted Pancho lives behind <ProtectedRoute />.
const PRIVATE_ROUTES = [
    { paths: ["/raise", "/raisePancho", "/raisePancho.html"], element: <RaisePancho /> },
    { paths: ["/stats", "/panchoStats", "/panchoStats.html"], element: <PanchoStats /> },
    { paths: ["/shop", "/Shop", "/Shop.html"], element: <Shop /> },
    { paths: ["/minigames", "/MiniGames", "/MiniGames.html"], element: <MiniGames /> }
];

function renderRoutes(routes, wrap) {
    return routes.flatMap(({ paths, element }) =>
        paths.map((path) => (
            <Route key={path} path={path} element={wrap ? wrap(element) : element} />
        ))
    );
}

// The global navbar is shown everywhere except on AboutUs, which has its
// own header with a single "back to Home" button.
const ABOUT_PATHS = PUBLIC_ROUTES.find((route) => route.element.type === AboutUs).paths;

export default function App() {
    const { pathname } = useLocation();
    const showNavbar = !ABOUT_PATHS.includes(pathname);

    return (
        <>
            {showNavbar && <HomeHeader />}
            <Routes>
                {renderRoutes(PUBLIC_ROUTES)}
                {renderRoutes(PRIVATE_ROUTES, (element) => (
                    <ProtectedRoute>{element}</ProtectedRoute>
                ))}
            </Routes>
        </>
    );
}
