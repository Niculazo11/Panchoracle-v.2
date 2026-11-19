import { asset } from "../../lib/asset.js";

export default function ConfirmPaw({ onConfirm }) {
    return (
        <section className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-20">
                <h2 className="text-black text-center text-sm font-semibold mt-3">Select this paw to confirm</h2>

                <a href="/raisePancho.html" id="confirmPawLink" onClick={onConfirm}>
                    <img id="confirm-paw" src={asset("images/paw.png")} className="w-28 h-28 object-contain rounded-full bg-[#6B5A8E] p-5 shadow-lg cursor-pointer" alt="" />
                </a>
            </div>
        </section>
    );
}
