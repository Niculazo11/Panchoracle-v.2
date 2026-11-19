import { useEffect, useState } from "react";
import { getSelectedDog, getStoredUsername } from "../lib/dogApi.js";
import { useDogImages } from "../lib/useDogImages.js";
import { useStatus } from "../lib/useStatus.js";
import PanchoStatusBanner from "../components/PanchoStatusBanner.jsx";
import { useGameState } from "../state/GameStateContext.jsx";
import ChooseForm from "./choose/ChooseForm.jsx";
import DogOptions from "./choose/DogOptions.jsx";
import JoinClassroomForm from "./choose/JoinClassroomForm.jsx";
import ConfirmPaw from "./choose/ConfirmPaw.jsx";
import { useChooseForm } from "./choose/useChooseForm.js";
import { useConfirmPancho } from "./choose/useConfirmPancho.js";
import { useJoinClassroom } from "./choose/useJoinClassroom.js";

export default function ChoosePancho() {
    const { choosePancho, student, init } = useGameState();
    const status = useStatus();
    const form = useChooseForm();

    const { images, loading, error, offline, reload } = useDogImages();
    const [selectedImage, setSelectedImage] = useState(null);
    const join = useJoinClassroom({ status, init });

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

    // The server creates the Pancho when the student joins a classroom, but panchoId/imgUrl stay
    // null until they pick one. So "has joined" is student.userId (only real server state has it),
    // not dog.id/dog.imgUrl: those are still empty right after a successful join.
    const needsJoin = !student?.userId;

    const handleConfirmPaw = useConfirmPancho({ form, selectedImage, status, choosePancho });
    const showRetry = !loading && Boolean(error || offline);

    return (
        <main className="min-h-screen bg-[#8B8170] flex flex-col items-center">
            <PanchoStatusBanner status={status.status} />

            <h1 className="text-4xl font-bold tracking-widest text-white mt-8 mb-12">Choose your Pancho</h1>

            {needsJoin ? (
                <JoinClassroomForm {...join} />
            ) : (
                <>
                    <DogOptions
                        dogImages={images}
                        selectedImage={selectedImage}
                        onSelect={setSelectedImage}
                        showRetry={showRetry}
                        onRetry={reload}
                    />

                    <ChooseForm formData={form.formData} errors={form.errors} handleChange={form.handleChange} />

                    <ConfirmPaw onConfirm={handleConfirmPaw} />
                </>
            )}
        </main>
    );
}