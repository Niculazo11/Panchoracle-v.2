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
import { joinClassroom } from "../lib/classroomApi.js";
import { asset } from "../lib/asset.js";

export default function ChoosePancho() {
    const { choosePancho, dog, init } = useGameState();
    const status = useStatus();
    const form = useChooseForm();

    const { images, loading, error, offline, reload } = useDogImages();
    const [selectedImage, setSelectedImage] = useState(null);
    const [joinCode, setJoinCode] = useState("");
    const [joining, setJoining] = useState(false);

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
    }, [loading, error, offline, status.showLoading, status.showOffline, status.showError, status.clearStatus]);

    // Pre-select this user's already-saved Pancho, if any. Also re-checks
    // when the typed name changes, since a saved Pancho is looked up per
    // username.
    useEffect(() => {
        const savedDog = getSelectedDog(form.formData.name || getStoredUsername());

        if (savedDog && images.includes(savedDog)) {
            setSelectedImage(savedDog);
        }
    }, [images, form.formData.name]);

    // If student has no Pancho yet (no dog.imgUrl), they need to join a classroom first.
    const needsJoin = !dog?.imgUrl && !dog?.id;

    const handleConfirmPaw = useConfirmPancho({ form, selectedImage, status, choosePancho });
    const showRetry = !loading && Boolean(error || offline);

    async function handleJoinClassroom(event) {
        event.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code) {
            status.showError("Enter a join code");
            return;
        }
        setJoining(true);
        status.showLoading();
        try {
            await joinClassroom(code);
            // Join succeeded: Pancho created. Refresh game state.
            await init();
            status.showSuccess("Joined classroom! Now choose your Pancho.");
        } catch (err) {
            status.showError(err.message || "Invalid join code");
        } finally {
            setJoining(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#8B8170] flex flex-col items-center">
            <PanchoStatusBanner status={status.status} />

            <h1 className="text-4xl font-bold tracking-widest text-white mt-8 mb-12">Choose your Pancho</h1>

            {needsJoin ? (
                // Join Classroom Form
                <section className="w-full max-w-md bg-white/90 dark:bg-[#2a2a2a] rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                    <h2 className="text-2xl font-bold text-center text-[#6B5A8E] dark:text-[#c9b8f5] mb-6">
                        Join a Classroom
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                        Enter the join code your teacher gave you to get your Pancho.
                    </p>
                    <form onSubmit={handleJoinClassroom} className="flex flex-col gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="ABC-123"
                                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest uppercase border-2 border-[#6B5A8E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B5A8E] dark:bg-[#1a1a1a] dark:text-white"
                                maxLength={16}
                                disabled={joining}
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={joining}
                            className="w-full py-3 bg-[#6B5A8E] text-white font-semibold rounded-lg hover:bg-[#5a4a7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {joining ? "Joining..." : "Join Classroom"}
                        </button>
                    </form>
                </section>
            ) : (
                // Normal Dog Selection
                <>
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
                                <img id="confirm-paw" src={asset("images/paw.png")} className="w-28 h-28 object-contain rounded-full bg-[#6B5A8E] p-5 shadow-lg cursor-pointer" alt="" />
                            </a>
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}