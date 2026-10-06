import { FAQ_ITEMS } from "./faqItems.jsx";

const CARD = "max-w-full sm:max-w-[92%] md:max-w-[90%] lg:max-w-[800px] mx-auto my-4 sm:my-5 p-[15px] sm:p-5 rounded-none sm:rounded-lg bg-[#c5cef5] shadow";

// Accordion driven purely by the URL hash (`#answerN`), no JS state:
// each answer is hidden by default and only shown while it's the
// current :target, via Tailwind's arbitrary-variant selector.
export default function FaqSection() {
    return (
        <section id="faq" className={CARD}>
            <h2 className="text-center text-black text-xl sm:text-2xl font-bold">Frequently Asked Questions</h2>

            {FAQ_ITEMS.map((item) => (
                <article key={item.id} className="mt-4">
                    <h3 className="text-center">
                        <a href={"#" + item.id} className="text-[#007BFF] no-underline hover:underline">{item.question}</a>
                    </h3>

                    <p id={item.id} className="hidden [&:target]:block text-left">
                        {item.answer}<br /> <br />
                        <a href="#faq" className="text-[#007BFF] no-underline hover:underline">Close</a>
                    </p>
                </article>
            ))}
        </section>
    );
}
