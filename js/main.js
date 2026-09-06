import {
    validateName,
    validateEmail,
    validatePassword
} from "./validation.js";

import { initializeCosmetics } from "./cosmetics.js";
import { showLoading, showSuccess, showError, showOffline, clearStatus } from "./panchoStatus.js";


// Small helper so a loading state is guaranteed to actually be visible for
// at least `ms` milliseconds, instead of flashing for 0ms when the real
// work (validation, localStorage save, a fast fetch) finishes instantly.
function wait(ms) {
    return new Promise(function (resolve) {
        window.setTimeout(resolve, ms);
    });
}


document.addEventListener("DOMContentLoaded", function () {

    console.log("Main JS loaded!");

    const savedName = localStorage.getItem("name");


    // ---------- Join form (index.html) ----------

    const form = document.getElementById("joinForm");

    if (form) {

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        const nameError = document.getElementById("nameError");
        const emailError = document.getElementById("emailError");
        const passwordError = document.getElementById("passwordError");

        const formSuccess = document.getElementById("formSuccess");
        const welcomeMessage = document.getElementById("welcomeMessage");

        if (savedName && welcomeMessage) {
            welcomeMessage.textContent = "Welcome back, " + savedName + "!";
        }

        form.addEventListener("submit", function (event) {

            event.preventDefault();

            const nameMessage = validateName(nameInput.value);
            const emailMessage = validateEmail(emailInput.value);
            const passwordMessage = validatePassword(passwordInput.value);

            nameError.textContent = nameMessage;
            emailError.textContent = emailMessage;
            passwordError.textContent = passwordMessage;

            if (
                nameMessage === "" &&
                emailMessage === "" &&
                passwordMessage === ""
            ) {

                localStorage.setItem("name", nameInput.value.trim());
                localStorage.setItem("email", emailInput.value.trim());

                formSuccess.textContent = "Welcome to Raise a Pancho!";

                form.reset();

            } else {

                formSuccess.textContent = "";
            }

        });
    }


    // ---------- Benefits search (index.html) ----------

    const searchInput = document.getElementById("searchInput");
    const benefits = document.querySelectorAll("#benefitsList li");
    const noResults = document.getElementById("noResults");

    if (searchInput && benefits.length && noResults) {

        benefits.forEach(function (benefit) {
            benefit.style.display = "none";
        });

        noResults.style.display = "none";

        searchInput.addEventListener("input", function () {

            const searchText = searchInput.value.toLowerCase().trim();

            let visibleBenefits = 0;

            benefits.forEach(function (benefit) {

                const benefitText = benefit.textContent.toLowerCase();

                if (
                    searchText !== "" &&
                    benefitText.includes(searchText)
                ) {

                    benefit.style.display = "list-item";
                    visibleBenefits++;

                } else {

                    benefit.style.display = "none";
                }
            });


            if (visibleBenefits === 0 && searchText !== "") {
                noResults.style.display = "block";
            } else {
                noResults.style.display = "none";
            }

        });


        document.addEventListener("keydown", function (event) {

            if (event.ctrlKey && event.key.toLowerCase() === "k") {

                event.preventDefault();

                const searchText = searchInput.value.toLowerCase().trim();

                if (searchText === "") {

                    searchInput.focus();
                    return;
                }


                let foundBenefit = null;

                benefits.forEach(function (benefit) {

                    const benefitText = benefit.textContent.toLowerCase();

                    if (
                        benefitText.includes(searchText) &&
                        foundBenefit === null
                    ) {

                        foundBenefit = benefit.textContent.trim();
                    }

                });


                if (foundBenefit !== null) {

                    const translationURL =
                        "https://translate.google.com/?sl=en&tl=es&text="
                        + encodeURIComponent(foundBenefit)
                        + "&op=translate";

                    window.open(translationURL, "_blank");
                }

            }

        });
    }


    // ---------- Cosmetics (index.html) ----------

    if (document.getElementById("cosmeticsLink")) {
        initializeCosmetics();
    }


    // ---------- Choose a Pancho (choosePancho.html) ----------

    const dogSelectionContainer = document.getElementById("dog-selection");
    const selectedDogImage = document.getElementById("pancho-image");
    const dogNameInput = document.getElementById("name");

    // If the user already joined on the home page, pre-fill their username
    // here so they don't have to type it again before picking a Pancho.
    if (dogSelectionContainer && dogNameInput && savedName && !dogNameInput.value) {
        dogNameInput.value = savedName;
    }

const retryButton = document.getElementById("retryDogFetch");

function toggleRetryButton(show){
    if (retryButton) {
        retryButton.classList.toggle("hidden", !show);
    }
}

async function loadPanchoDogs() {

    if (!dogSelectionContainer) {
        return;
    }

    if (!navigator.onLine) {
        showOffline("No internet connection");
        toggleRetryButton(true);
        return;
    }

    showLoading();
    toggleRetryButton(false);

    const result = await Promise.all([
        initializeDogSelection(dogSelectionContainer),
        wait(600)
    ]);

    const success = result[0];

    if (success) {
        clearStatus();
        toggleRetryButton(false);
    } else {
        showError();
        toggleRetryButton(true);
    }
}

    if (dogSelectionContainer) {
        loadPanchoDogs();
    }    

    if (retryButton) {
        retryButton.addEventListener("click", function () {
            loadPanchoDogs();
        });
    }

    window.addEventListener("offline", function () {
        if (dogSelectionContainer) {
            showOffline("Internet connection lost");
            toggleRetryButton(true);
        }
    });

    window.addEventListener("online", function () {
        if (dogSelectionContainer) {
            loadPanchoDogs();
        }
    });
    
    if (selectedDogImage) {
        displaySelectedDog(selectedDogImage);
    }

    const confirmPawLink = document.getElementById("confirmPawLink");
    const confirmPaw = document.getElementById("confirm-paw");

    if (confirmPawLink && confirmPaw) {

        confirmPawLink.addEventListener("click", async function (event) {

            // Don't navigate yet — only go to the main page once we know
            // the whole form is valid AND the selection actually saved.
            event.preventDefault();

            const nameInputEl = document.getElementById("name");
            const emailInputEl = document.getElementById("email");
            const passwordInputEl = document.getElementById("password");

            const nameErrorEl = document.getElementById("nameError");
            const emailErrorEl = document.getElementById("emailError");
            const passwordErrorEl = document.getElementById("passwordError");

            const nameMessage = nameInputEl ? validateName(nameInputEl.value) : "";
            const emailMessage = emailInputEl ? validateEmail(emailInputEl.value) : "";
            const passwordMessage = passwordInputEl ? validatePassword(passwordInputEl.value) : "";

            if (nameErrorEl) nameErrorEl.textContent = nameMessage;
            if (emailErrorEl) emailErrorEl.textContent = emailMessage;
            if (passwordErrorEl) passwordErrorEl.textContent = passwordMessage;

            if (nameMessage !== "" || emailMessage !== "" || passwordMessage !== "") {
                showError("Please complete the form correctly first.");
                return;
            }

            showLoading();

            // Keep the loading banner visible for a moment before showing
            // the result — confirming/saving is instant, so without this
            // pause the loading state would never actually get painted.
            await wait(700);

            const result = confirmPancho();

            if (result.success) {

                showSuccess();

                // 1.5s so the success banner is clearly visible before navigating.
                window.setTimeout(function () {
                    window.location.href = confirmPawLink.href;
                }, 1000);

            } else {

                showError(result.message);
            }

        });
    }

});