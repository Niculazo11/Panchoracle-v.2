import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateName, validateEmail, validatePassword } from "../lib/validation.js";
import { getDachshunds, getSelectedDog, saveSelectedDog, getStoredUsername, dogIdFromUrl } from "../lib/dogApi.js";
import { useStatus } from "../lib/useStatus.js";
import PanchoStatusBanner from "../components/PanchoStatusBanner.jsx";
import { useGameState } from "../state/GameStateContext.jsx";

function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function ChoosePancho() {
    const navigate = useNavigate();
    const { choosePancho, init } = useGameState();
    const { status, showLoading, showSuccess, showError, showOffline, clearStatus } = useStatus();

    const [dogImages, setDogImages] = useState([null, null]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [showRetry, setShowRetry] = useState(false);

    const [name, setName] = useState(() => getStoredUsername());
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [nameError, setNameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [emailError, setEmailError] = useState("");

    const isLoadingRef = useRef(false);

    async function loadPanchoDogs() {
        if (isLoadingRef.current) {
            return;
        }
        isLoadingRef.current = true;

        if (!navigator.onLine) {
            showOffline("No internet connection");
            setShowRetry(true);
            isLoadingRef.current = false;
            return;
        }

        showLoading();
        setShowRetry(false);

        const [{ images, fromCache }] = await Promise.all([getDachshunds(), wait(600)]);

        if (images.length < 2) {
            showError();
            setShowRetry(true);
            isLoadingRef.current = false;
            return;
        }

        setDogImages(images);
        clearStatus();
        setShowRetry(false);

        // Pre-select this user's already-saved Pancho, if any.
        const savedDog = getSelectedDog(name || getStoredUsername());
        if (savedDog && images.includes(savedDog)) {
            setSelectedImage(savedDog);
        }

        isLoadingRef.current = false;
    }

    useEffect(() => {
        loadPanchoDogs();

        function handleOffline() {
            showOffline("Internet connection lost");
            setShowRetry(true);
        }
        function handleOnline() {
            loadPanchoDogs();
        }

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleConfirmPaw(event) {
        event.preventDefault();

        const nameMessage = validateName(name);
        const emailMessage = validateEmail(email);
        const passwordMessage = validatePassword(password);

        setNameError(nameMessage);
        setEmailError(emailMessage);
        setPasswordError(passwordMessage);

        if (nameMessage !== "" || emailMessage !== "" || passwordMessage !== "") {
            showError("Please complete the form correctly first.");
            return;
        }

        showLoading();
        await wait(700);

        // ---- confirmPancho() logic, ported from dogApi.js ----
        const username = name.trim();

        if (!username) {
            setNameError("Please enter a username before confirming your Pancho.");
            showError("Enter a username first.");
            return;
        }

        if (!selectedImage) {
            showError("Choose a Pancho first!");
            return;
        }

        setNameError("");
        const saved = saveSelectedDog(selectedImage, username);

        if (!saved) {
            showError("Could not save your Pancho.");
            return;
        }

        init(username);
        choosePancho(dogIdFromUrl(selectedImage), selectedImage);

        showSuccess();

        window.setTimeout(() => {
            navigate("/raisePancho.html");
        }, 1000);
    }

    return (
        <div className="min-h-screen bg-[#8B8170] flex flex-col items-center">
            <PanchoStatusBanner status={status} />

            <h1 className="text-4xl font-bold tracking-widest text-white mt-8 mb-12">Choose  to pancho</h1>

            <section id="dog-selection" className="images flex items-center justify-center gap-16 mb-12">
                {[0, 1].map((index) => (
                    <img
                        key={index}
                        src={dogImages[index] || ""}
                        alt={dogImages[index] ? `Dachshund Pancho option ${index + 1}` : ""}
                        onClick={() => dogImages[index] && setSelectedImage(dogImages[index])}
                        className={
                            "w-48 h-48 object-cover rounded-xl bg-[#D9D9D9] shadow-lg cursor-pointer transition" +
                            (dogImages[index] && selectedImage === dogImages[index] ? " ring-4 ring-yellow-400" : "")
                        }
                    />
                ))}
            </section>

            <button
                id="retryDogFetch"
                onClick={loadPanchoDogs}
                className={"mt-2 mb-8 px-5 py-2 rounded-full bg-red-600 text-white font-semibold shadow-md hover:bg-red-700 transition" + (showRetry ? "" : " hidden")}
            >
                Retry
            </button>

            <section className="NamePancho mb-14">
                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="w-full">
                        <label htmlFor="name" className="block text-white mb-1">Username:</label>
                        <input type="text" id="name" name="name" className="w-full rounded px-3 py-2 shadow-md" value={name} onChange={(e) => setName(e.target.value)} />
                        <span id="nameError" className="block text-red-200 text-sm mt-1">{nameError}</span>
                    </div>

                    <div className="w-full">
                        <label htmlFor="password" className="block text-white mb-1">Password:</label>
                        <input type="password" id="password" name="password" className="w-full rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <span id="passwordError" className="block text-red-200 text-sm mt-1">{passwordError}</span>
                    </div>

                    <div className="w-full">
                        <label htmlFor="email" className="block text-white mb-1">E-mail:</label>
                        <input type="email" id="email" name="email" className="w-full rounded px-3 py-2 shadow-md" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <span id="emailError" className="block text-red-200 text-sm mt-1">{emailError}</span>
                    </div>
                </form>
            </section>

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
