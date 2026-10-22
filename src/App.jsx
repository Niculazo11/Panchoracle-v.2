import { Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useDogParkAccess } from "./lib/useDogParkAccess.js";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import ChoosePancho from "./pages/ChoosePancho.jsx";
import RaisePancho from "./pages/RaisePancho.jsx";
import PanchoStats from "./pages/PanchoStats.jsx";
import Shop from "./pages/Shop.jsx";
import CosmeticDetail from "./pages/CosmeticDetail.jsx";
import MiniGames from "./pages/MiniGames.jsx";
import HomeHeader from "./pages/home/HomeHeader.jsx";
import DogParkLogin from "./pages/dogpark/DogParkLogin.jsx";
import TeachersPark from "./pages/teacherspark/TeachersPark.jsx";

// Every page is reachable both through its original .html path (so the
// links migrated from the static site keep working) and through a short,
// clean path.
const PUBLIC_ROUTES = [
    { paths: ["/"], element: <Home /> },
    { paths: ["/login"], element: <Login /> },
    { paths: ["/aboutus", "/aboutus.html"], element: <AboutUs /> },
    // Adoption is the entry point of the game: it is what creates the
    // account, so it cannot sit behind the login guard.
    { paths: ["/choose", "/choosePancho", "/choosePancho.html"], element: <ChoosePancho /> },
    // Standalone gate in front of the Dog Park placeholder — separate
    // login/account system. After a successful login it sends the person
    // back to the page they were trying to open (default: /teachersPark).
    { paths: ["/dogpark-login", "/dogParkLogin.html"], element: <DogParkLogin /> }
];

// Teachers' area: only reachable with the Dog Park access flag.
// Anyone else is redirected to /dogpark-login (see the render below).

const DOG_PARK_ROUTES = [
    // Old placeholder URL: it now just forwards to the real Teachers Park.
    { paths: ["/dogpark", "/dogPark.html"], element: <Navigate replace to="/teachersPark" /> },
    // Has its own top bar, so the global navbar is hidden (see below).
    { paths: ["/teachersPark", "/teachersPark.html"], element: <TeachersPark /> }
]

const PRIVATE_ROUTES = [
    { paths: ["/raise", "/raisePancho", "/raisePancho.html"], element: <RaisePancho /> },
    // ":username" is the registered student's name (student.id); the
    // static paths still work and get redirected to the dynamic one by
    // PanchoStats itself, via useParams().
    { paths: ["/stats/:username", "/stats", "/panchoStats", "/panchoStats.html"], element: <PanchoStats /> },
    { paths: ["/shop", "/Shop", "/Shop.html"], element: <Shop /> },
    // Per-item deep link into the shop, same pattern as /stats/:username.
    { paths: ["/Shop/:cosmeticId"], element: <CosmeticDetail /> },
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
const TEACHERS_PARK_PATHS = DOG_PARK_ROUTES.find((route) => route.element.type === TeachersPark).paths;

export default function App() {
    const { pathname } = useLocation();
    const showNavbar = !ABOUT_PATHS.includes(pathname) && !TEACHERS_PARK_PATHS.includes(pathname);

    return (
        <>
            {showNavbar && <HomeHeader />}
            <Routes>
                {renderRoutes(PUBLIC_ROUTES)}
                {renderRoutes(PRIVATE_ROUTES, (element) => (
                    <ProtectedRoute>{element}</ProtectedRoute>
                ))}
                 {renderRoutes(DOG_PARK_ROUTES, (element) => (
                    <ProtectedRoute redirectTo="/dogpark-login" useAllowed={useDogParkAccess}>
                        {element}
                    </ProtectedRoute>
                ))}
            </Routes>
        </>
    );
}
