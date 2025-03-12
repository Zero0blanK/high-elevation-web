const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');

if (priceRange && priceValue) {
    priceRange.addEventListener('input', function() {
        const value = this.value;
        priceValue.textContent = `₱${value}${value == 2000 ? '+' : ''}`;
    });
}

// Clear filters button
const clearFilters = document.getElementById('clearFilters');
if (clearFilters) {
    clearFilters.addEventListener('click', function() {
        window.location.href = '/product';
    });
}
