const bookingButton = document.getElementById("bookingButton");
const headerBookingButton = document.getElementById("headerBookingButton");

function showBookingMessage() {
    alert("Спасибо! Запись на обслуживание скоро будет доступна.");
}

if (bookingButton) {
    bookingButton.addEventListener("click", showBookingMessage);
}

if (headerBookingButton) {
    headerBookingButton.addEventListener("click", showBookingMessage);
}