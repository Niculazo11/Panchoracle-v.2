import PanchoLayers from "../../components/PanchoLayers.jsx";

// Left column of /Shop/:cosmeticId: Pancho with what he's wearing plus
// the transient feedback message.
export default function CosmeticPreview({ dog, feedback }) {
    return (
        <section className="w-full flex flex-col items-center gap-3 sm:w-72 sm:shrink-0">
            <div className="relative w-44 h-44 sm:w-64 sm:h-64 rounded-2xl bg-white/40 shadow-xl border-4 border-white/60 overflow-hidden">
                <PanchoLayers dog={dog} />
            </div>
            <p className="min-h-[1.25rem] text-sm font-semibold text-black text-center">{feedback}</p>
        </section>
    );
}
