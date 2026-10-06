// Shared "card" look (bg + rounded + shadow) replicated per-section with
// Tailwind, matching the one generic `section` rule the old stylesheet
// applied to every <section> on this page.
const CARD = "max-w-full sm:max-w-[92%] md:max-w-[90%] lg:max-w-[800px] mx-auto my-4 sm:my-5 p-[15px] sm:p-5 rounded-none sm:rounded-lg bg-[#c5cef5] shadow";

export default function AboutTeam() {
    return (
        <section id="About" className={CARD}>
            <h2 className="text-center text-black text-xl sm:text-2xl font-bold">About Us</h2>
            <p className="text-center text-[#050505]">
                As an independant group, we are looking for a tool that will facilitate
                study sessions and the way of teaching students in an interactive manner
                that will motivate them to work autonomously. We will be differentiated
                from the others considering that our web will not only be an online
                learning tool to share assignments, rather an interactive tool to post
                assignments that also serves as a way to post various minigames with a
                focus on learning, incentivised by various accessories offered to
                customise your pet. Completing an assignment will be also a way
                to take care of your pet, so that if you do not complete your assignments,
                your pet will starve. This will also serve as a way for the teacher to grade their students.
            </p>
            <h3 className="text-center text-black text-lg font-semibold mt-3">Our team</h3>
            <ul className="text-center list-none p-0">
                <li>Karol Dayanne Rodriguez: Lead Back-End Developer</li>
                <li>Nicolás Moreno: Project manager + QA tester</li>
                <li>Mariana González: UI/UX Designer + Front-End Developer</li>
                <li>Isaac Bonilla: Full-Stack Developer</li>
            </ul>
        </section>
    );
}
