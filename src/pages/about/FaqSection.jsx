import { FAQ_ITEMS } from "./faqItems.jsx";

export default function FaqSection() {
    return (
        <section id="faq">
            <h2>Frequently Asked Questions</h2>

            {FAQ_ITEMS.map((item) => (
                <article key={item.id}>
                    <h3>
                        <a href={"#" + item.id}>{item.question}</a>
                    </h3>

                    <p id={item.id}>
                        {item.answer}<br /> <br />
                        <a href="#faq">Close</a>
                    </p>
                </article>
            ))}
        </section>
    );
}
