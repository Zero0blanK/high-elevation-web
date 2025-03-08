
  // Mobile menu toggle
  const burgerIcon = document.querySelector('.burger-icon');
  const closeMenu = document.querySelector('.close-menu');
  const navMenu = document.getElementById('nav-menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  

function toggleMenu() {
    navMenu.classList.toggle('active');
    burgerIcon.classList.toggle('active');
    burgerIcon.setAttribute('aria-expanded', navMenu.classList.contains('active'));
}

burgerIcon.addEventListener('click', toggleMenu);
closeMenu.addEventListener('click', toggleMenu);

// Prevent scroll when menu is open
navMenu.addEventListener('touchmove', function (e) {
    if (navMenu.classList.contains('active')) {
        e.preventDefault();
    }
}, { passive: false });
  
// Profile dropdown toggle
const profileIcon = document.getElementById('profile-icon');
const profileDropdown = document.getElementById('profile-dropdown');

if (profileIcon && profileDropdown) {
profileIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (profileDropdown.classList.contains('active') && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove('active');
    }
});
}
