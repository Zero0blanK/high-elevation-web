// JavaScript to toggle the dropdown
const profileIcon = document.querySelector('#profile-icon');
const dropdown = document.querySelector('.profile-dropdown');

// Toggle dropdown
profileIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.classList.toggle('show');

    // Position dropdown relative to profile icon with fixed positioning
    const rect = profileIcon.getBoundingClientRect();

    // Set the dropdown position to be fixed and align it with the profile icon
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 10}px`; // 10px offset below the icon
    dropdown.style.right = `${window.innerWidth - rect.right}px`; // Align right side
});


// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target) && !profileIcon.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});