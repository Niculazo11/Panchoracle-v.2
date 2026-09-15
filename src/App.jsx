import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import ChoosePancho from "./pages/ChoosePancho.jsx";
import RaisePancho from "./pages/RaisePancho.jsx";
import PanchoStats from "./pages/PanchoStats.jsx";
import Shop from "./pages/Shop.jsx";
import MiniGames from "./pages/MiniGames.jsx";

// One route per original .html page. Paths mirror the original
// filenames so existing links/behavior are easy to reason about.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/aboutus.html" element={<AboutUs />} />
      <Route path="/aboutus" element={<AboutUs />} />
      <Route path="/choosePancho.html" element={<ChoosePancho />} />
      <Route path="/choosePancho" element={<ChoosePancho />} />
      <Route path="/raisePancho.html" element={<RaisePancho />} />
      <Route path="/raisePancho" element={<RaisePancho />} />
      <Route path="/panchoStats.html" element={<PanchoStats />} />
      <Route path="/panchoStats" element={<PanchoStats />} />
      <Route path="/Shop.html" element={<Shop />} />
      <Route path="/Shop" element={<Shop />} />
      <Route path="/MiniGames.html" element={<MiniGames />} />
      <Route path="/MiniGames" element={<MiniGames />} />
    </Routes>
  );
}
