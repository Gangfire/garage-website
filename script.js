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

const siteConfig = window.GARAGE_CONFIG;

function setConfiguredText(id, value) {
    const element = document.getElementById(id);

    if (element && typeof value === "string") {
        element.textContent = value;
    }
}

if (siteConfig) {
    const business = siteConfig.business;
    const hero = siteConfig.hero;

    document.title = business.pageTitle;
    document.querySelector(".brand")?.setAttribute("aria-label", `${business.name} — на главную`);
    document.querySelector(".page-loader")?.setAttribute("aria-label", `Загрузка ${business.name}`);
    setConfiguredText("businessName", business.name);
    setConfiguredText("businessTagline", business.tagline);
    setConfiguredText("loaderLogo", business.name);
    setConfiguredText("footerBrandName", business.name);

    const brandMark = document.querySelector(".brand-mark");
    if (brandMark && business.name) {
        brandMark.textContent = business.name.charAt(0).toUpperCase();
    }

    const heroSection = document.querySelector(".hero");
    heroSection?.setAttribute("aria-label", `Главный экран ${business.name}`);
    setConfiguredText("galleryEyebrow", `Пространство ${business.name}`);
    setConfiguredText("heroEyebrow", hero.eyebrow);
    setConfiguredText("heroDescription", hero.description);
    setConfiguredText("bookingButton", hero.primaryButton);
    setConfiguredText("servicesButtonLabel", hero.secondaryButton);
    setConfiguredText("heroStatus", hero.status);
    setConfiguredText("heroCaptionLabel", hero.captionLabel);
    setConfiguredText("heroCaptionText", hero.caption);

    const heroTitle = document.getElementById("heroTitle");
    if (heroTitle && Array.isArray(hero.titleLines)) {
        heroTitle.replaceChildren();
        hero.titleLines.forEach((line, index) => {
            if (index > 0) {
                heroTitle.append(document.createElement("br"));
            }

            heroTitle.append(document.createTextNode(line));
        });
    }

    setConfiguredText("servicesTitle", siteConfig.servicesTitle);
    const servicesSection = document.getElementById("services");
    const visibleServices = siteConfig.services.filter(service => service.visible !== false);

    if (servicesSection) {
        servicesSection.querySelectorAll(".service").forEach(card => card.remove());

        visibleServices.forEach(service => {
            const card = document.createElement("div");
            const name = document.createElement("h3");
            const description = document.createElement("p");
            const price = document.createElement("span");

            card.className = "service";
            card.dataset.serviceId = service.id;
            name.textContent = service.name;
            description.textContent = service.description;
            price.textContent = service.price;
            card.append(name, description, price);
            servicesSection.append(card);
        });
    }

    const serviceSelect = document.getElementById("serviceType");
    const placeholderOption = serviceSelect?.options[0];
    if (serviceSelect && placeholderOption) {
        placeholderOption.textContent = siteConfig.servicePlaceholder;
        serviceSelect.replaceChildren(placeholderOption);

        visibleServices.forEach(service => {
            const option = document.createElement("option");
            option.value = service.name;
            option.textContent = service.name;
            serviceSelect.append(option);
        });
    }

    const contactPhones = document.getElementById("contactPhones");
    if (contactPhones && Array.isArray(business.phones)) {
        contactPhones.replaceChildren();
        business.phones.forEach((phone, index) => {
            const link = document.createElement("a");
            link.href = phone.href;
            link.textContent = phone.text;
            contactPhones.append(link);

            if (index < business.phones.length - 1) {
                contactPhones.append(document.createElement("br"));
            }
        });
    }

    setConfiguredText("contactAddress", business.address);
    setConfiguredText("contactHours", business.hours);

    const encodedAddress = encodeURIComponent(business.address);
    const googleMapsRoute = document.getElementById("googleMapsRoute");
    const yandexMapsRoute = document.getElementById("yandexMapsRoute");
    if (googleMapsRoute) {
        googleMapsRoute.href = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    }
    if (yandexMapsRoute) {
        yandexMapsRoute.href = `https://yandex.ru/maps/?text=${encodedAddress}&rtext=~${encodedAddress}&rtt=auto`;
    }
}

if (window.location.hash) {
    const initialHash = window.location.hash.slice(1);
    const initialHashTarget = document.getElementById(decodeURIComponent(initialHash));
    initialHashTarget?.scrollIntoView({ behavior: "auto" });
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
let formChangedDuringRequest = false;
const bookingCooldownStorageKey = "avtomehanika.bookingCooldownUntil";
const bookingCooldownDuration = 10 * 60 * 1000;
let bookingCooldownUntil = 0;
let cooldownWasConfirmedInThisSession = false;
let bookingCooldownTimer = null;

try {
    const savedCooldownUntil = Number(window.localStorage.getItem(bookingCooldownStorageKey));
    if (Number.isFinite(savedCooldownUntil) && savedCooldownUntil > Date.now()) {
        bookingCooldownUntil = savedCooldownUntil;
    } else {
        window.localStorage.removeItem(bookingCooldownStorageKey);
    }
} catch {
    bookingCooldownUntil = 0;
}

function formatCooldownTime(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function refreshBookingCooldown() {
    const remaining = bookingCooldownUntil - Date.now();
    if (remaining <= 0) {
        if (bookingCooldownUntil > 0) {
            bookingCooldownUntil = 0;
            cooldownWasConfirmedInThisSession = false;
            hasPassedLocalCheck = false;
            try {
                window.localStorage.removeItem(bookingCooldownStorageKey);
            } catch {
                // Local storage only supports the user-facing timer.
            }

            if (/^(Заявка успешно отправлена|Повторную заявку)/.test(formMessage.textContent)) {
                formMessage.textContent = "Повторную заявку снова можно отправить.";
            }
        }

        submitButton.disabled = false;
        return false;
    }

    const message = cooldownWasConfirmedInThisSession
        ? "Заявка успешно отправлена в Telegram. Повторную заявку можно отправить через"
        : "Повторную заявку можно отправить через";
    formMessage.textContent = `${message} ${formatCooldownTime(remaining)}.`;
    submitButton.disabled = true;
    return true;
}

function startBookingCooldownTimer() {
    if (bookingCooldownTimer === null) {
        bookingCooldownTimer = window.setInterval(function () {
            if (!refreshBookingCooldown()) {
                window.clearInterval(bookingCooldownTimer);
                bookingCooldownTimer = null;
            }
        }, 1000);
    }
}

if (bookingCooldownUntil > Date.now()) {
    refreshBookingCooldown();
    startBookingCooldownTimer();
}

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
    let phoneInputHasGeneratedPrefix = false;

    function hasAllowedPhoneCharacters(value, allowPartialParenthesis = false) {
        if (!/^[0-9+\s()-]+$/.test(value) || /(?:\+{2,}|-{2,}|\({2,}|\){2,}|\s{2,})/.test(value)) {
            return false;
        }

        const compactValue = value.replace(/[\s()-]/g, "");
        const plusCount = (compactValue.match(/\+/g) || []).length;
        if (plusCount > 1 || (plusCount === 1 && !compactValue.startsWith("+7"))) {
            return false;
        }

        const openingParentheses = (value.match(/\(/g) || []).length;
        const closingParentheses = (value.match(/\)/g) || []).length;
        if (openingParentheses > 1 || closingParentheses > 1) {
            return false;
        }

        if (openingParentheses !== closingParentheses) {
            return allowPartialParenthesis && openingParentheses === 1 && closingParentheses === 0;
        }

        return openingParentheses === 0 || value.indexOf("(") < value.indexOf(")");
    }

    function getRussianPhoneDigits(value, hasGeneratedPrefix = false) {
        const phoneValue = value.trim();
        if (!phoneValue) {
            return "";
        }

        if (!hasAllowedPhoneCharacters(phoneValue, hasGeneratedPrefix)) {
            return null;
        }

        const compactValue = phoneValue.replace(/[\s()-]/g, "");
        const hasInternationalPrefix = compactValue.startsWith("+");
        let digits = hasInternationalPrefix ? compactValue.slice(2) : compactValue;

        if (!/^\d+$/.test(digits)) {
            return null;
        }

        if ((hasGeneratedPrefix || !hasInternationalPrefix) && digits.length === 11 && /^[78]/.test(digits)) {
            digits = digits.slice(1);
        }

        if (digits.length !== 10 || !/^[3-9]/.test(digits)) {
            return null;
        }

        return digits;
    }

    function formatRussianPhoneInput(event) {
        const phoneValue = customerPhone.value.trim();
        if (!phoneValue) {
            phoneInputHasGeneratedPrefix = false;
            return;
        }

        const isPastedValue = event.inputType === "insertFromPaste" || event.inputType === "insertReplacementText";
        const usesGeneratedPrefix = phoneInputHasGeneratedPrefix && !isPastedValue && phoneValue.startsWith("+7");
        if (!hasAllowedPhoneCharacters(phoneValue, usesGeneratedPrefix)) {
            phoneInputHasGeneratedPrefix = false;
            return;
        }

        const compactValue = phoneValue.replace(/[\s()-]/g, "");
        const hasInternationalPrefix = compactValue.startsWith("+");
        let digits = hasInternationalPrefix ? compactValue.slice(2) : compactValue;

        if (!/^\d*$/.test(digits)) {
            phoneInputHasGeneratedPrefix = false;
            return;
        }

        if ((usesGeneratedPrefix || !hasInternationalPrefix) && digits.length === 11 && /^[78]/.test(digits)) {
            digits = digits.slice(1);
        }

        if (digits.length > 10) {
            phoneInputHasGeneratedPrefix = false;
            return;
        }

        let formattedValue = "+7";
        if (digits.length > 0) {
            formattedValue += ` (${digits.slice(0, 3)}`;
        }
        if (digits.length >= 3) {
            formattedValue += ")";
        }
        if (digits.length > 3) {
            formattedValue += ` ${digits.slice(3, 6)}`;
        }
        if (digits.length > 6) {
            formattedValue += `-${digits.slice(6, 8)}`;
        }
        if (digits.length > 8) {
            formattedValue += `-${digits.slice(8, 10)}`;
        }

        customerPhone.value = formattedValue;
        phoneInputHasGeneratedPrefix = true;
        customerPhone.setSelectionRange(formattedValue.length, formattedValue.length);
    }

    function updateBookingValidation() {
        const nameIsOnlyWhitespace = customerName.value.length > 0 && !customerName.value.trim();
        const vehicleValue = vehicle.value.trim();
        const vehicleCompactValue = vehicleValue.replace(/\s/g, "");
        const vehicleIsInvalid = vehicle.value.length > 0 && (
            vehicleValue.length < 3 ||
            /^\d+$/.test(vehicleCompactValue)
        );
        const phoneValue = customerPhone.value.trim();
        const phoneDigits = getRussianPhoneDigits(phoneValue, phoneInputHasGeneratedPrefix);
        const phoneIsValid = phoneDigits !== null && phoneDigits.length === 10;

        customerName.setCustomValidity(nameIsOnlyWhitespace ? "Введите имя, а не только пробелы." : "");
        vehicle.setCustomValidity(vehicleIsInvalid ? "Укажите марку и модель автомобиля (не менее 3 символов)." : "");
        const phoneIsOnlyWhitespace = customerPhone.value.length > 0 && !phoneValue;
        customerPhone.setCustomValidity(phoneIsOnlyWhitespace
            ? "Введите телефон, а не только пробелы."
            : phoneValue && !phoneIsValid
                ? "Введите российский номер: 10 цифр или 11 цифр с 7 или 8."
                : "");
    }

    customerPhone.addEventListener("input", formatRussianPhoneInput);

    function resetLocalCheck() {
        if (isProcessing) {
            formChangedDuringRequest = true;
            return;
        }

        hasPassedLocalCheck = false;
        submitButton.disabled = false;
        updateBookingValidation();

        if (!refreshBookingCooldown()) {
            formMessage.textContent = "";
        }
    }

    bookingForm.addEventListener("input", resetLocalCheck);
    bookingForm.addEventListener("change", resetLocalCheck);

    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (isProcessing || hasPassedLocalCheck || refreshBookingCooldown()) {
            return;
        }

        updateBookingValidation();

        if (!bookingForm.reportValidity()) {
            return;
        }

        const formData = new FormData(bookingForm);
        const payload = {
            name: String(formData.get("name") || "").trim(),
            phone: String(formData.get("phone") || "").trim(),
            vehicle: String(formData.get("vehicle") || "").trim(),
            service: String(formData.get("service") || ""),
            comment: String(formData.get("comment") || "").trim()
        };

        isProcessing = true;
        formChangedDuringRequest = false;
        submitButton.disabled = true;
        formMessage.textContent = "Отправляем заявку…";

        try {
            const response = await fetch("https://avtomehanika-orders.19gc19.workers.dev/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            let result = null;
            try {
                result = await response.json();
            } catch {
                result = null;
            }

            if (response.ok && result?.ok === true) {
                bookingCooldownUntil = Date.now() + bookingCooldownDuration;
                cooldownWasConfirmedInThisSession = true;
                hasPassedLocalCheck = true;
                try {
                    window.localStorage.setItem(bookingCooldownStorageKey, String(bookingCooldownUntil));
                } catch {
                    // Keep the UX cooldown in memory if browser storage is unavailable.
                }
                refreshBookingCooldown();
                startBookingCooldownTimer();
                return;
            }

            const serverMessage = typeof result?.error === "string" ? result.error.trim() : "";
            formMessage.textContent = serverMessage || "Не удалось отправить заявку. Проверьте данные и попробуйте позже.";
            hasPassedLocalCheck = false;
        } catch {
            formMessage.textContent = "Не удалось связаться с сервисом. Проверьте подключение и попробуйте ещё раз.";
            hasPassedLocalCheck = false;
        } finally {
            isProcessing = false;
            if (bookingCooldownUntil > Date.now()) {
                refreshBookingCooldown();
                startBookingCooldownTimer();
            } else {
                submitButton.disabled = hasPassedLocalCheck && !formChangedDuringRequest;
            }
        }
    });
}

const serviceGallery = document.getElementById("serviceGallery");
const galleryLightbox = document.getElementById("galleryLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");

document.addEventListener("contextmenu", function (event) {
    if (event.target instanceof Element && event.target.closest(".hero-card img, .gallery-item img")) {
        event.preventDefault();
    }
});

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