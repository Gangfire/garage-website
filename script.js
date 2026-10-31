const bookingButton = document.getElementById("bookingButton");
const headerBookingButton = document.getElementById("headerBookingButton");
const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

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
    bookingForm.addEventListener("input", function () {
        formMessage.textContent = "";
    });

    bookingForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!bookingForm.reportValidity()) {
            return;
        }

        formMessage.textContent = "Проверка пройдена. Данные не отправлены и не сохранены.";
    });
}