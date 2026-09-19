import { Link } from "react-router-dom";

export default function HeroSection() {
    return (
        <>
            <section className="py-16 sm:py-24 px-5 text-center w-full box-border">
                <h2 className="font-display text-2xl sm:text-4xl m-0">An inventive tool to learn.</h2>
            </section>

            <section className="flex flex-col md:flex-row justify-around items-center md:items-start gap-10 md:gap-5 w-full py-10 md:py-0 md:min-h-screen px-5">
                <article className="flex-1 text-center">
                    <h2 className="text-xl font-normal mb-[25px]">Adopt a Pancho</h2>

                    <Link to="/choosePancho.html">
                        <img src="/images/perritocafe.png" alt="Light brown Pancho puppy looking at the camera." className="w-[90%] max-w-[300px] rounded-[20px] block mx-auto" />
                    </Link>
                </article>

                <article className="flex-1 text-center">
                    <h2 className="text-xl font-normal mb-[25px]">Take Care of Your Pancho</h2>
                    <a href="#joinForm">
                        <img src="/images/SalchichaAjedrez.png" alt="Brown Pancho playing chess." className="w-[90%] max-w-[300px] rounded-[20px] block mx-auto" />
                    </a>
                </article>

                <article className="flex-1 text-center">
                    <h2 className="text-xl font-normal mb-[25px]">Enter Our Dog Park</h2>
                    <a href="#joinForm">
                        <img src="/images/perrosX2.png" alt="Panchos sitting and looking at the camera." className="w-[90%] max-w-[300px] rounded-[20px] block mx-auto" />
                    </a>
                </article>
            </section>

            <section>
                <article className="py-[50px] px-5 sm:px-10 md:px-[100px] text-center w-full h-auto box-border">
                    <img src="/images/ReadMoreMatress.png" alt="Pancho's matress that reads 'Read More' on it." className="w-[800px] max-w-[90%] sm:max-w-[80%] rounded-[40px] block mx-auto mt-[10px] mb-[60px]" />

                    <Link to="/aboutus.html" className="inline-block px-5 py-[10px] bg-[rgb(21,116,62)] dark:bg-[#5d7467] text-white dark:text-white text-[15px] no-underline rounded">Read More</Link>
                </article>
            </section>
        </>
    );
}
