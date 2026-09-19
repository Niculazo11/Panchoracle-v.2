import HomeHeader from "./home/HomeHeader.jsx";
import HeroSection from "./home/HeroSection.jsx";
import BenefitsSection from "./home/BenefitsSection.jsx";
import TestimonialSection from "./home/TestimonialSection.jsx";
import ContactSection from "./home/ContactSection.jsx";
import JoinSection from "./home/JoinSection.jsx";
import HomeFooter from "./home/HomeFooter.jsx";

// Same page as before, only split into section components so no file
// goes over the line limit. The markup/classes are untouched.
export default function Home() {
    return (
        <div className="bg-[rgb(149,248,165)] dark:bg-[#18351f] m-0">
            <HomeHeader />

            <main className="pt-[70px] sm:pt-[60px]">
                <HeroSection />
                <BenefitsSection />
                <TestimonialSection />
                <ContactSection />
                <JoinSection />
            </main>

            <HomeFooter />
        </div>
    );
}
