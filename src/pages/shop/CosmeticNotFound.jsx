import { Link } from "react-router-dom";

// Shown by /Shop/:cosmeticId when the id in the URL isn't in the catalog.
export default function CosmeticNotFound() {
    return (
        <div className="min-h-screen bg-[#c69f85] flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-lg font-semibold text-black">
                That item doesn't exist.
            </p>
            <Link
                to="/shop"
                className="px-5 py-2 rounded-full bg-[#6B5A8E] text-white font-semibold shadow hover:opacity-90 transition"
            >
                Back to shop
            </Link>
        </div>
    );
}
