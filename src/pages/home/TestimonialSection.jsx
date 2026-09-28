export default function TestimonialSection() {
    return (
        <>
            <section className="w-full h-[40vh] sm:h-[60vh] md:min-h-screen md:h-auto">
                <img src="/images/SalchichaVestidoCustomizacion.png" alt="Pancho cosmetics advertisement. It advertises a new way to customize your Pancho." className="w-full h-full object-cover" />
            </section>

            <section className="flex flex-col md:flex-row items-center gap-6 md:gap-10 px-5 md:px-[100px] py-10 md:py-[50px]">
                <article className="flex-1">
                    <img src="/images/SalchichaLenguaAfuera.png" alt="Pancho with its tongue out, eyes half closedd, looking quite happy." className="w-[70%] sm:w-full max-w-[300px] sm:max-w-none mx-auto block" />
                </article>

                <article className="flex-1 text-center md:text-left">
                    <h2 className="font-display text-xl sm:text-2xl font-normal">
                        "Raise a Pancho is possibly the most useful web page I could
                        ever find! Taking care of their pets with their homework is very
                        engaging for my students and making up the tasks has been very
                        easy and comfortable for me. It is didactic, fun and educative.
                        Definitely would recommend for students and teachers."
                    </h2>

                    <p className="mt-4">Sarah Smith</p>
                    <p>English Teacher</p>
                </article>
            </section>
        </>
    );
}
