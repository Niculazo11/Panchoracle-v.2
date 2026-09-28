import { Link } from "react-router-dom";
import { ABOUT_US_STYLES } from "./about/styles/index.js";
import { usePageStyles } from "./about/usePageStyles.js";
import AboutNav from "./about/AboutNav.jsx";
import AboutHero from "./about/AboutHero.jsx";
import AboutTeam from "./about/AboutTeam.jsx";
import AboutProject from "./about/AboutProject.jsx";
import FaqSection from "./about/FaqSection.jsx";

export default function AboutUs() {

    usePageStyles("aboutus-page-styles", ABOUT_US_STYLES);

    return (
        <>
            <header style={{ padding: "10px 20px", backgroundColor: "rgb(106, 158, 201)" }}>
                <Link to="/" style={{ color: "rgb(14, 12, 12)", fontWeight: "bold" }}>← Back to Home</Link>
            </header>
            <AboutNav />
            <AboutHero />
            <AboutTeam />
            <AboutProject />
            <FaqSection />
        </>
    );
}
