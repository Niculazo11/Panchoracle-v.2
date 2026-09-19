import { Link } from "react-router-dom";

export default function HomeHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 w-full box-border flex flex-wrap justify-between items-center gap-2 px-4 sm:px-[50px] py-2 sm:py-[2px] font-bold bg-[#8ff08c] dark:bg-[#214d2a]">
            <h1 className="font-display text-xl sm:text-[2rem] text-left text-black dark:text-white m-0">Raise a Pancho</h1>

            <nav className="flex justify-end items-center">
                <Link to="/" className="font-display font-semibold text-sm sm:text-xl no-underline text-black dark:text-white mx-2 sm:mx-5 font-bold capitalize">Home</Link>
                <Link to="/aboutus.html" className="font-display font-semibold text-sm sm:text-xl no-underline text-black dark:text-white mx-2 sm:mx-5 font-bold capitalize">About Us</Link>
            </nav>
        </header>
    );
}
