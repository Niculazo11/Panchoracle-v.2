// The two Pancho options plus the retry button. Loading/error feedback
// itself is shown by <PanchoStatusBanner /> on the page.
export default function DogOptions({ dogImages, selectedImage, onSelect, showRetry, onRetry }) {
    return (
        <>
            <section id="dog-selection" className="images flex items-center justify-center gap-16 mb-12">
                {[0, 1].map((index) => (
                    <img
                        key={index}
                        src={dogImages[index] || ""}
                        alt={dogImages[index] ? `Dachshund Pancho option ${index + 1}` : ""}
                        onClick={() => dogImages[index] && onSelect(dogImages[index])}
                        className={
                            "w-48 h-48 object-cover rounded-xl bg-[#D9D9D9] shadow-lg cursor-pointer transition" +
                            (dogImages[index] && selectedImage === dogImages[index] ? " ring-4 ring-yellow-400" : "")
                        }
                    />
                ))}
            </section>

            <button
                id="retryDogFetch"
                onClick={onRetry}
                className={"mt-2 mb-8 px-5 py-2 rounded-full bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 transition" + (showRetry ? "" : " hidden")}
            >
                Retry
            </button>
        </>
    );
}
