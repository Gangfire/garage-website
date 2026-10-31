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