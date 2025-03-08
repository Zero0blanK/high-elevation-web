// Elements
const productCards = document.querySelectorAll('.product-card');
const productCount = document.getElementById('productCount');
const searchBar = document.getElementById('productSearch');
const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
const sizeCheckboxes = document.querySelectorAll('input[name="size"]');
const priceRange = document.getElementById('priceRange');
const sortSelect = document.getElementById('sortBy');
const applyFiltersBtn = document.getElementById('applyFilters');
const clearFiltersBtn = document.getElementById('clearFilters');
const quickViewBtns = document.querySelectorAll('.quick-view-btn');

// Filter function
function filterProducts() {
    const searchTerm = searchBar.value.toLowerCase();
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    const selectedSizes = Array.from(sizeCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
    const maxPrice = parseInt(priceRange.value);
    
    let visibleCount = 0;
    
    productCards.forEach(card => {
        const title = card.querySelector('.product-title').textContent.toLowerCase();
        const price = parseInt(card.querySelector('.current-price').textContent.replace('₱', ''));
        const category = card.dataset.category;
        
        // Check available sizes (this would need to be more sophisticated in a real application)
        const sizeElements = card.querySelectorAll('.size-chip');
        const sizes = Array.from(sizeElements).map(el => el.textContent);
        
        // Determine if card should be visible
        let isVisible = true;
        
        // Search filter
        if (searchTerm && !title.includes(searchTerm)) {
            isVisible = false;
        }
        
        // Category filter
        if (selectedCategories.length > 0 && !selectedCategories.includes(category)) {
            isVisible = false;
        }
        
        // Size filter (basic implementation)
        if (selectedSizes.length > 0 && !sizes.some(size => selectedSizes.includes(size))) {
            isVisible = false;
        }
        
        // Price filter
        if (price > maxPrice) {
            isVisible = false;
        }
        
        // Update visibility
        card.style.display = isVisible ? 'block' : 'none';
        
        if (isVisible) visibleCount++;
    });
    
    // Update count
    productCount.textContent = visibleCount;
}

// Sort function
function sortProducts(sortBy) {
    const cardsArray = Array.from(productCards);
    const container = document.querySelector('.product-cards-container');
    
    cardsArray.sort((a, b) => {
        const priceA = parseInt(a.querySelector('.current-price').textContent.replace('₱', ''));
        const priceB = parseInt(b.querySelector('.current-price').textContent.replace('₱', ''));
        
        switch(sortBy) {
            case 'price-low':
                return priceA - priceB;
            case 'price-high':
                return priceB - priceA;
            default:
                return 0;
        }
    });
    
    // Remove all current cards
    productCards.forEach(card => card.remove());
    
    // Add sorted cards back
    cardsArray.forEach(card => {
        container.appendChild(card);
    });
}

// Event listeners
applyFiltersBtn.addEventListener('click', filterProducts);

clearFiltersBtn.addEventListener('click', function() {
    // Reset all filters
    searchBar.value = '';
    categoryCheckboxes.forEach(checkbox => checkbox.checked = false);
    sizeCheckboxes.forEach(checkbox => checkbox.checked = false);
    priceRange.value = 2000;
    document.getElementById('priceValue').textContent = '₱2000+';
    
    // Reset visibility
    productCards.forEach(card => card.style.display = 'block');
    productCount.textContent = productCards.length;
});

sortSelect.addEventListener('change', function() {
    sortProducts(this.value);
});

// Simple pagination (for demonstration)
const pageNumbers = document.querySelectorAll('.page-number');
pageNumbers.forEach(page => {
    page.addEventListener('click', function() {
        pageNumbers.forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        // In a real application, you would load the appropriate page
    });
});
