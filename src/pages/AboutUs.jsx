import { Link } from "react-router-dom";
import AboutNav from "./about/AboutNav.jsx";
import AboutHero from "./about/AboutHero.jsx";
import AboutTeam from "./about/AboutTeam.jsx";
import AboutProject from "./about/AboutProject.jsx";
import FaqSection from "./about/FaqSection.jsx";

export default function AboutUs() {
    return (
        <div className="bg-[#91b7ce] min-h-screen font-sans">
            <header className="px-5 py-[10px] bg-[#6a9ec9]">
                <Link to="/" className="font-bold text-[#0e0c0c] no-underline hover:underline">← Back to Home</Link>
            </header>
            <AboutNav />
            <AboutHero />
            <AboutTeam />
            <AboutProject />
            <FaqSection />
        </div>
    );
}
