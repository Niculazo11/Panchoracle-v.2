import { useEffect, useState } from "react";
import { getSelectedDog, getStoredUsername } from "../lib/dogApi.js";
import { useDogImages } from "../lib/useDogImages.js";
import { useStatus } from "../lib/useStatus.js";
import PanchoStatusBanner from "../components/PanchoStatusBanner.jsx";
import { useGameState } from "../state/GameStateContext.jsx";
import ChooseForm from "./choose/ChooseForm.jsx";
import DogOptions from "./choose/DogOptions.jsx";
import { useChooseForm } from "./choose/useChooseForm.js";
import { useConfirmPancho } from "./choose/useConfirmPancho.js";

export default function ChoosePancho() {
    const game = useGameState();
    const status = useStatus();
    const form = useChooseForm();

    const { images, loading, error, offline, reload } = useDogImages();
    const [selectedImage, setSelectedImage] = useState(null);

    // Mirrors the 3 states of the request onto the floating banner.
    useEffect(() => {
        if (loading) {
            status.showLoading();
        } else if (offline) {
            status.showOffline(offline);
        } else if (error) {
            status.showError(error);
        } else {
            status.clearStatus();
        }
    }, [loading, error, offline]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pre-select this user's already-saved Pancho, if any.
    useEffect(() => {
        const savedDog = getSelectedDog(form.formData.name || getStoredUsername());

        if (savedDog && images.includes(savedDog)) {
            setSelectedImage(savedDog);
        }
    }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleConfirmPaw = useConfirmPancho({ form, selectedImage, status, game });
    const showRetry = !loading && Boolean(error || offline);

    return (
        <div className="min-h-screen bg-[#8B8170] flex flex-col items-center">
            <PanchoStatusBanner status={status.status} />

            <h1 className="text-4xl font-bold tracking-widest text-white mt-8 mb-12">Choose  to pancho</h1>

            <DogOptions
                dogImages={images}
                selectedImage={selectedImage}
                onSelect={setSelectedImage}
                showRetry={showRetry}
                onRetry={reload}
            />

            <ChooseForm formData={form.formData} errors={form.errors} handleChange={form.handleChange} />

            <section className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center justify-center gap-20">
                    <h2 className="text-black text-center text-sm font-semibold mt-3">Select this paw to confirm</h2>

                    <a href="/raisePancho.html" id="confirmPawLink" onClick={handleConfirmPaw}>
                        <img id="confirm-paw" src="/images/paw.png" className="w-28 h-28 object-contain rounded-full bg-[#6B5A8E] p-5 shadow-lg cursor-pointer" alt="" />
                    </a>
                </div>
            </section>
        </div>
    );
}
