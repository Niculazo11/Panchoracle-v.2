import { useNavigate } from "react-router-dom";
import { saveSelectedDog, dogIdFromUrl } from "../../lib/dogApi.js";
import { hasErrors } from "../../lib/validation.js";
import { wait } from "../../lib/wait.js";

const CONFIRM_DELAY_MS = 700;
const REDIRECT_DELAY_MS = 1000;

export function useConfirmPancho({ form, selectedImage, status, game }) {
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

        game.init(username);
        game.choosePancho(dogIdFromUrl(selectedImage), selectedImage);
        // grantAccess removed: user already authenticated via join form login

        status.showSuccess();
        form.resetAfterSuccess();

        window.setTimeout(() => navigate("/raisePancho.html"), REDIRECT_DELAY_MS);
    }

    return handleConfirmPaw;
}