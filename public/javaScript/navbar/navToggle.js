const burgerButton = document.querySelector('.burger-icon');
const navMenu = document.querySelector('.nav-menu');
const closeButton = document.querySelector('.close-menu');

function toggleMenu() {
    navMenu.classList.toggle('active');
    burgerButton.classList.toggle('active');
    burgerButton.setAttribute('aria-expanded', navMenu.classList.contains('active'));
}

burgerButton.addEventListener('click', toggleMenu);
closeButton.addEventListener('click', toggleMenu);

// Prevent scroll when menu is open
navMenu.addEventListener('touchmove', function (e) {
    if (navMenu.classList.contains('active')) {
        e.preventDefault();
    }
}, { passive: false });
