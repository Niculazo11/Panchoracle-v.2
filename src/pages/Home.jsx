import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { validateName, validateEmail, validatePassword } from "../lib/validation.js";
import { getStoredUsername } from "../lib/dogApi.js";

// Same 5 benefits as the original #benefitsList <li> items, in the same
// order, so the search/filter logic (main.js) has identical data to work
// with.
const BENEFITS = [
    "It offers a new and fun way to engage your students.",
    "It provides with a clear and fun way to hand-in homework,  making it into a way of taking care of your virtual pet.",
    "Your students' Pancho is customizable through in-game currency, so they will have an active goal to work towards.",
    "It provides an easy way to check how your students are doing. Their virtual pet will show you how much they have been taking care of.",
    "You can set additiional academic funny activities aside from homeworks"
];

export default function Home() {
    const savedName = getStoredUsername();

    // ---------- Join form state ----------
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    // NOTE: the original #formSuccess paragraph always keeps the Tailwind
    // "hidden" class (main.js only ever updates its textContent, never
    // removes "hidden") -- ported here exactly as-is, text updates but
    // stays invisible, matching the original site's behavior 1:1.
    const [formSuccessText, setFormSuccessText] = useState("Thanks for raising a Pancho!");

    const welcomeMessage = savedName ? `Welcome back, ${savedName}!` : "Join Raise a Pancho";

    function handleSubmit(event) {
        event.preventDefault();

        const nameMessage = validateName(name);
        const emailMessage = validateEmail(email);
        const passwordMessage = validatePassword(password);

        setNameError(nameMessage);
        setEmailError(emailMessage);
        setPasswordError(passwordMessage);

        if (nameMessage === "" && emailMessage === "" && passwordMessage === "") {
            localStorage.setItem("name", name.trim());
            localStorage.setItem("email", email.trim());

            setFormSuccessText("Welcome to Raise a Pancho!");

            setName("");
            setEmail("");
            setPassword("");
            setMessage("");
        } else {
            setFormSuccessText("");
        }
    }

    // ---------- Benefits search ----------
    const [searchText, setSearchText] = useState("");
    const searchInputRef = useRef(null);

    const normalizedSearch = searchText.toLowerCase().trim();

    const visibleBenefits = useMemo(() => {
        if (normalizedSearch === "") {
            return [];
        }
        return BENEFITS.filter((b) => b.toLowerCase().includes(normalizedSearch));
    }, [normalizedSearch]);

    const showNoResults = normalizedSearch !== "" && visibleBenefits.length === 0;

    useEffect(() => {
        function handleKeydown(event) {
            if (event.ctrlKey && event.key.toLowerCase() === "k") {
                event.preventDefault();

                if (normalizedSearch === "") {
                    searchInputRef.current && searchInputRef.current.focus();
                    return;
                }

                const foundBenefit = BENEFITS.find((b) => b.toLowerCase().includes(normalizedSearch));

                if (foundBenefit) {
                    const translationURL =
                        "https://translate.google.com/?sl=en&tl=es&text=" +
                        encodeURIComponent(foundBenefit) +
                        "&op=translate";

                    window.open(translationURL, "_blank");
                }
            }
        }

        document.addEventListener("keydown", handleKeydown);
        return () => document.removeEventListener("keydown", handleKeydown);
    }, [normalizedSearch]);

    return (
        <div className="bg-[rgb(149,248,165)] dark:bg-[#18351f] m-0">
            <header className="fixed top-0 left-0 right-0 w-full box-border flex flex-wrap justify-between items-center gap-2 px-4 sm:px-[50px] py-2 sm:py-[2px] font-bold bg-[#8ff08c] dark:bg-[#214d2a]">
                <h1 className="font-display text-xl sm:text-[2rem] text-left text-black dark:text-white m-0">Raise a Pancho</h1>

                <nav className="flex justify-end items-center">
                    <Link to="/" className="font-display font-semibold text-sm sm:text-xl no-underline text-black dark:text-white mx-2 sm:mx-5 font-bold capitalize">Home</Link>
                    <Link to="/aboutus.html" className="font-display font-semibold text-sm sm:text-xl no-underline text-black dark:text-white mx-2 sm:mx-5 font-bold capitalize">About Us</Link>
                </nav>
            </header>

            <main className="pt-[70px] sm:pt-[60px]">

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

                <section className="forStudents py-16 sm:py-24 px-5 text-center w-full h-auto box-border">
                    <h2 className="font-display text-2xl sm:text-4xl font-normal mb-[25px] flex justify-center">Engage your students</h2>

                    <p className="font-display text-base sm:text-lg max-w-3xl mx-auto">
                        Raise a Pancho is designed to help teachers engage their students
                        in a fun and interactive way. By taking care of their virtual pet,
                        students will be motivated to complete their homework and learn new skills.
                    </p>

                    <article className="flex flex-col md:flex-row items-center justify-between w-full md:min-h-[80vh] gap-10 md:gap-[50px] px-5 md:px-[100px] py-10 md:py-0 box-border">
                        <div className="flex-1 text-left">
                            <h2 className="font-display text-2xl sm:text-4xl font-normal mb-[25px]">Need a way to engage your students?</h2>

                            <p className="font-display text-base sm:text-lg">
                                Raise a Pancho could be the way to go. The website is designed with your students in mind.
                            </p>

                            <div className="mt-6 mb-4">
                                <label htmlFor="searchInput" className="block font-display text-base sm:text-lg mb-2">Search benefits:</label>
                                <input
                                    type="text"
                                    id="searchInput"
                                    ref={searchInputRef}
                                    placeholder="Type to search"
                                    className="w-full max-w-sm rounded px-3 py-2 border border-gray-300 dark:text-black"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>

                            <ol id="benefitsList" className="text-left font-display text-base sm:text-lg list-decimal pl-6 space-y-3">
                                {BENEFITS.map((benefit) => (
                                    <li key={benefit} style={{ display: visibleBenefits.includes(benefit) ? "list-item" : "none" }}>
                                        <p>{benefit}</p>
                                    </li>
                                ))}
                            </ol>
                            <p id="noResults" className="text-left font-display text-base sm:text-lg mt-3" style={{ display: showNoResults ? "block" : "none" }}>No benefits found.</p>
                        </div>

                        <img src="/images/PerritoMirandoKiut.png" alt="A brown Pancho looking at the camera. The camera is over the Pancho." className="w-[60%] max-w-[280px] mx-auto md:mx-0 md:w-[30%] md:max-w-[450px] h-auto block rounded-[10%]" />
                    </article>
                </section>

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

                <section className=" bg-[rgb(44,182,78)] dark:bg-[#17652e] text-center w-full py-16 px-5 md:px-[100px] box-border">
                    <h2 id="welcomeMessage" className="font-display text-2xl sm:text-3xl text-white mb-6">{welcomeMessage}</h2>

                    <form id="joinForm" onSubmit={handleSubmit} className="flex flex-col items-center gap-4 max-w-md mx-auto text-left">

                        <div className="w-full">
                            <label htmlFor="name" className="block text-white mb-1">Name:</label>
                            <input type="text" id="name" name="name" className="w-full rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
                            <span id="nameError" className="block text-red-200 text-sm mt-1">{nameError}</span>
                        </div>

                        <div className="w-full">
                            <label htmlFor="email" className="block text-white mb-1">Email:</label>
                            <input type="email" id="email" name="email" className="w-full rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <span id="emailError" className="block text-red-200 text-sm mt-1">{emailError}</span>
                        </div>

                        <div className="w-full">
                            <label htmlFor="password" className="block text-white mb-1">Password:</label>
                            <input type="password" id="password" name="password" className="w-full rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <span id="passwordError" className="block text-red-200 text-sm mt-1">{passwordError}</span>
                        </div>

                        <div className="w-full">
                            <label htmlFor="message" className="block text-white mb-1">Are you a student or a teacher?</label>
                            <textarea id="message" name="message" className="w-full rounded px-3 py-2" value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
                        </div>

                        <button type="submit" className="inline-block px-5 py-2 bg-[rgb(21,116,62)] dark:bg-[#5d7467] text-white rounded">Join us</button>

                        <p id="formSuccess" className="hidden text-white font-semibold">{formSuccessText}</p>

                    </form>
                </section>

            </main>

            <footer className="text-center py-6 bg-[#8ff08c] dark:bg-[#214d2a] text-black dark:text-white">
                <p>&copy; 2026 Raise a Pancho</p>
            </footer>
        </div>
    );
}
