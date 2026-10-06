// Section anchors for the page; styled with the same nav look used
// elsewhere (bg + centered links), now via Tailwind instead of a
// hand-rolled stylesheet.
export default function AboutNav() {
    return (
        <nav className="w-full bg-[#6a9ec9] border-2 border-[#6a9ec9] py-[15px]">
            <ul className="flex flex-wrap md:flex-nowrap justify-center items-center gap-2 sm:gap-4 md:gap-[30px] px-[10px] m-0 list-none">
                <li><a href="#About" className="font-bold text-[#0e0c0c] no-underline hover:underline">About Us</a></li>
                <li><a href="#problematic" className="font-bold text-[#0e0c0c] no-underline hover:underline">Problem Statement</a></li>
                <li><a href="#objectives" className="font-bold text-[#0e0c0c] no-underline hover:underline">Project Objectives</a></li>
                <li><a href="#figma" className="font-bold text-[#0e0c0c] no-underline hover:underline">Figma Wireframe</a></li>
            </ul>
        </nav>
    );
}
