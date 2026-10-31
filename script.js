const pageLoader = document.getElementById("pageLoader");

if (pageLoader) {
    let loaderHidden = false;
    let loaderFallbackTimer;

    function hidePageLoader() {
        if (loaderHidden) {
            return;
        }

        loaderHidden = true;
        window.clearTimeout(loaderFallbackTimer);
        pageLoader.classList.add("is-hidden");
        pageLoader.setAttribute("aria-hidden", "true");
        window.setTimeout(function () {
            pageLoader.hidden = true;
        }, 220);
    }

    loaderFallbackTimer = window.setTimeout(hidePageLoader, 6000);

    if (document.readyState === "complete") {
        hidePageLoader();
    } else {
        window.addEventListener("load", hidePageLoader, { once: true });
    }
}

const bookingButton = document.getElementById("bookingButton");
const headerBookingButton = document.getElementById("headerBookingButton");
const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");
const submitButton = bookingForm?.querySelector('button[type="submit"]');
const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const vehicle = document.getElementById("vehicle");

let isProcessing = false;
let hasPassedLocalCheck = false;

function showBookingMessage() {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
}

if (bookingButton) {
    bookingButton.addEventListener("click", showBookingMessage);
}

if (headerBookingButton) {
    headerBookingButton.addEventListener("click", showBookingMessage);
}

if (bookingForm && formMessage) {
    function updateBookingValidation() {
        const nameIsOnlyWhitespace = customerName.value.length > 0 && !customerName.value.trim();
        const vehicleIsOnlyWhitespace = vehicle.value.length > 0 && !vehicle.value.trim();
        const phoneValue = customerPhone.value.trim();
        const phoneDigits = phoneValue.replace(/\D/g, "");
        const phoneHasAllowedCharacters = /^[0-9\s()+-]+$/.test(phoneValue);
        const phoneIsValid = phoneHasAllowedCharacters && (
            phoneDigits.length === 10 ||
            (phoneDigits.length === 11 && /^[78]/.test(phoneDigits))
        );

        customerName.setCustomValidity(nameIsOnlyWhitespace ? "Введите имя, а не только пробелы." : "");
        vehicle.setCustomValidity(vehicleIsOnlyWhitespace ? "Укажите марку и модель автомобиля." : "");
        customerPhone.setCustomValidity(phoneValue && !phoneIsValid ? "Введите российский номер: 10 цифр или 11 цифр с 7 или 8." : "");
    }

    function resetLocalCheck() {
        formMessage.textContent = "";
        hasPassedLocalCheck = false;
        submitButton.disabled = false;
        updateBookingValidation();
    }

    bookingForm.addEventListener("input", resetLocalCheck);
    bookingForm.addEventListener("change", resetLocalCheck);

    bookingForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (isProcessing || hasPassedLocalCheck) {
            return;
        }

        updateBookingValidation();

        if (!bookingForm.reportValidity()) {
            return;
        }

        isProcessing = true;
        submitButton.disabled = true;
        formMessage.textContent = "Проверка пройдена. Данные не отправлены и не сохранены.";
        hasPassedLocalCheck = true;
        isProcessing = false;
    });
}

const serviceGallery = document.getElementById("serviceGallery");
const galleryLightbox = document.getElementById("galleryLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

if (serviceGallery && galleryLightbox && lightboxImage && lightboxCaption && lightboxClose) {
    serviceGallery.addEventListener("click", function (event) {
        const galleryItem = event.target.closest(".gallery-item");

        if (!galleryItem) {
            return;
        }

        lightboxImage.src = galleryItem.dataset.fullSrc;
        lightboxImage.alt = galleryItem.dataset.imageAlt;
        lightboxCaption.textContent = galleryItem.dataset.caption;
        galleryLightbox.showModal();
    });

    lightboxClose.addEventListener("click", function () {
        galleryLightbox.close();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && galleryLightbox.open) {
            galleryLightbox.close();
        }
    });

    galleryLightbox.addEventListener("click", function (event) {
        if (event.target === galleryLightbox) {
            galleryLightbox.close();
        }
    });

    galleryLightbox.addEventListener("close", function () {
        lightboxImage.removeAttribute("src");
        lightboxImage.alt = "";
        lightboxCaption.textContent = "";
    });
}

const backToTopButton = document.getElementById("backToTop");
const protectedScrollElements = document.querySelectorAll("#booking .booking-form, #contacts .contact-item");

if (backToTopButton) {
    function updateBackToTopVisibility() {
        const buttonStyles = window.getComputedStyle(backToTopButton);
        const buttonWidth = parseFloat(buttonStyles.width);
        const buttonHeight = parseFloat(buttonStyles.height);
        const buttonRight = window.innerWidth - parseFloat(buttonStyles.right);
        const buttonBottom = window.innerHeight - parseFloat(buttonStyles.bottom);
        const buttonLeft = buttonRight - buttonWidth;
        const buttonTop = buttonBottom - buttonHeight;
        const overlapsProtectedElement = [...protectedScrollElements].some(element => {
            const rect = element.getBoundingClientRect();

            return rect.right > buttonLeft && rect.left < buttonRight &&
                rect.bottom > buttonTop && rect.top < buttonBottom;
        });

        backToTopButton.hidden = window.scrollY < 280 || overlapsProtectedElement;
    }

    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
    window.addEventListener("resize", updateBackToTopVisibility);
    updateBackToTopVisibility();

    backToTopButton.addEventListener("click", function () {
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        window.scrollTo({ top: 0, behavior });
    });
}

const siteHeader = document.querySelector(".site-header");
const mobileHeaderQuery = window.matchMedia("(max-width: 600px)");
let previousHeaderScrollY = window.scrollY;
let headerScrollDirection = 0;
let headerDirectionDistance = 0;

if (siteHeader) {
    function updateHeaderOnScroll() {
        const currentScrollY = window.scrollY;

        if (!mobileHeaderQuery.matches || currentScrollY < 48) {
            siteHeader.classList.remove("is-compact");
            headerScrollDirection = 0;
            headerDirectionDistance = 0;
            previousHeaderScrollY = currentScrollY;
            return;
        }

        const scrollDelta = currentScrollY - previousHeaderScrollY;
        const currentDirection = Math.sign(scrollDelta);

        if (currentDirection !== 0) {
            if (currentDirection === headerScrollDirection) {
                headerDirectionDistance += Math.abs(scrollDelta);
            } else {
                headerScrollDirection = currentDirection;
                headerDirectionDistance = Math.abs(scrollDelta);
            }

            const directionThreshold = currentDirection > 0 ? 32 : 24;

            if (headerDirectionDistance >= directionThreshold) {
                siteHeader.classList.toggle("is-compact", currentDirection > 0);
                headerDirectionDistance = 0;
            }
        }

        previousHeaderScrollY = currentScrollY;
    }

    window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
    window.addEventListener("resize", updateHeaderOnScroll);
    updateHeaderOnScroll();
}