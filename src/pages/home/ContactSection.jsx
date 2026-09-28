import { Link } from "react-router-dom";

export default function ContactSection() {
    return (
        <section className="bg-[#71f78e] dark:bg-[#1c5a2c] py-16 sm:py-24 px-5 text-center w-full min-h-[60vh] sm:min-h-screen flex flex-col justify-center items-center ">

            <div className="flex flex-col items-center gap-6">
                <h2 className="font-display text-3xl sm:text-5xl m-0">Got any issues?</h2>

                <p className="font-display text-xl sm:text-[34px]">Contact us.</p>

                <a href="#" className="inline-block bg-black dark:bg-white text-[#f8f4f4] dark:text-[#080808] border-none px-5 py-[10px] text-lg cursor-pointer rounded no-underline flex gap-6">
                    Learn More
                </a>

                <Link to="/aboutus.html" target="_blank" className="underline text-black dark:text-white">About Us</Link>
            </div>
        </section>
    );
}
