import { useNavigate } from "react-router-dom";
import { saveSelectedDog, dogIdFromUrl } from "../../lib/dogApi.js";
import { hasErrors } from "../../lib/validation.js";
import { wait } from "../../lib/wait.js";
import { ApiError } from "../../lib/api.js";

const CONFIRM_DELAY_MS = 700;
const REDIRECT_DELAY_MS = 1000;

export function useConfirmPancho({ form, selectedImage, status, choosePancho }) {
    const navigate = useNavigate();

    async function handleConfirmPaw(event) {
        const nextErrors = form.validateAll();

        if (hasErrors(nextErrors)) {
            event.preventDefault();
            status.showError("Please complete the form correctly first.");
            return;
        }

        event.preventDefault();

        if (!selectedImage) {
            status.showError("Choose a Pancho first!");
            return;
        }

        status.showLoading();
        await wait(CONFIRM_DELAY_MS);

        const username = form.formData.name.trim();

        if (!saveSelectedDog(selectedImage, username)) {
            status.showError("Could not save your Pancho.");
            return;
        }

        // Initialize game state and choose Pancho via async API
        try {
            await choosePancho(dogIdFromUrl(selectedImage), selectedImage);
        } catch (error) {
            // Clear loading state and show user-friendly error
            status.clearStatus();
            const message = error instanceof ApiError
                ? error.message
                : "Failed to choose Pancho. Please try again.";
            status.showError(message);
            return;
        }

        status.showSuccess();
        form.resetAfterSuccess();

        window.setTimeout(() => navigate("/raisePancho.html"), REDIRECT_DELAY_MS);
    }

    return handleConfirmPaw;
}