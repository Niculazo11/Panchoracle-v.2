// The background image path depends on Vite's base URL at runtime, so
// it stays as an inline style; everything else (layout, card look,
// typography) is plain Tailwind utilities.
export default function AboutHero() {
    return (
        <section
            className="max-w-[800px] mx-auto my-4 sm:my-5 rounded-none sm:rounded-lg shadow-sm bg-[#c9e0ec] bg-cover bg-center h-auto sm:h-[300px] px-5 py-[30px] sm:py-5 flex flex-col items-center justify-center text-center text-[#0f0f0f]"
            style={{
                backgroundImage: `linear-gradient(rgba(152, 178, 233, 0.4), rgba(152, 183, 223, 0.4)), url("${import.meta.env.BASE_URL}images/herooff.jpg")`
            }}
        >
            <h1 className="text-[1.6rem] sm:text-3xl font-bold text-black">GROW A PANCHO</h1>
            <p className="text-[0.95rem] sm:text-base text-[#050505]">
                Welcome to the GROW A PANCHO website! We are a website focused on aid the autonomous learning of the students by various minigames, ways to leave homeworks to the students, and cosmetic incentives. Pancho is a good dog! he will eat and be happy as long as you do your homeworks and will tell your teacher to put you a good grade; but if he is starving and unhappy he will tell your teacher to put a bad grade on you, be aware!.
            </p>
        </section>
    );
}
