import { BENEFITS } from "./benefits.js";
import { useBenefitsSearch } from "./useBenefitsSearch.js";

export default function BenefitsSection() {
    const { searchText, setSearchText, searchInputRef, visibleBenefits, showNoResults } = useBenefitsSearch();

    return (
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
    );
}
