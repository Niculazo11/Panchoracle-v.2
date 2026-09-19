import PanchoLayers from "../../components/PanchoLayers.jsx";

export default function ShopPreview({ dog, feedback }) {
    return (
        <section className="w-full flex flex-col items-center gap-3 lg:w-72 lg:shrink-0">

            <div id="pancho-container" className="relative w-44 h-44 sm:w-64 sm:h-64 rounded-2xl bg-white/40 shadow-xl border-4 border-white/60 overflow-hidden">
                <PanchoLayers dog={dog} />
            </div>

            <p id="shopFeedback" className="min-h-[1.25rem] text-sm font-semibold text-black text-center">{feedback}</p>

            <a href="/raisePancho.html"
               className="mt-2 px-5 py-2 rounded-full bg-[#6B5A8E] text-white font-semibold shadow hover:opacity-90 transition">
                come back
            </a>
        </section>
    );
}
