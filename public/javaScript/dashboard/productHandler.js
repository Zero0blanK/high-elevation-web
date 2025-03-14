// Enable/disable variant inputs based on checkbox
function handleCheckboxToggle(modalSelector) {
    document.querySelectorAll(`${modalSelector} .variant-card input[type="checkbox"]`).forEach(checkbox => {
        checkbox.addEventListener("change", function () {
            let priceInput = this.closest(".variant-card").querySelector("input[type='number']");
            let stockInput = this.closest(".variant-card").querySelector("input[type='hidden']");

            if (this.checked) {
                priceInput.removeAttribute("disabled");
                stockInput.removeAttribute("disabled");
            } else {
                if (modalSelector === "#addProductModal") { // Reset only in Add Modal
                    priceInput.value = "";
                    stockInput.value = "0";
                }
                priceInput.setAttribute("disabled", "true");
                stockInput.setAttribute("disabled", "true");
            }
        });
    });
}

handleCheckboxToggle("#addProductModal");
handleCheckboxToggle("#editProductModal");

document.querySelector('.cat-filter').addEventListener('change', function () {
    let selectedCategory = this.value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
        let productCategory = card.getAttribute('data-product-category').toLowerCase();
        if (selectedCategory === 'all-category' || productCategory === selectedCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});


const productFilter = document.querySelector('.pro-filter');
const activeProduct = productFilter.value;

const filterProducts = (selectedStatus) => {
    document.querySelectorAll('.product-card').forEach(card => {
        const isDeleted = card.getAttribute('data-deleted-product') === '1';
        card.style.display = (selectedStatus === '0' && !isDeleted) || (selectedStatus === '1' && isDeleted) ? 'block' : 'none';
    });
};

filterProducts(activeProduct);
productFilter.addEventListener('change', function () {
    filterProducts(this.value); // Apply the filter when the dropdown value changes
});


// Show/hide modals
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

// Show success notification
function showNotification() {
    const notification = document.getElementById('successNotification');
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Event listeners
document.querySelectorAll('.close-btn, .cancel-btn').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        modal.classList.remove('show');
    });
});


// Add product button
document.querySelector('.add-order-btn').addEventListener('click', () => {
    showModal('addProductModal');
});

// Function to handle the "Edit Product" functionality
document.querySelectorAll('.edit-product').forEach(button => {
    button.addEventListener('click', function () {
        const productId = this.dataset.id;
        fetch(`/dashboard/products/${productId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(product => {
                document.getElementById('editProductId').value = product.id;
                document.getElementById('editProductName').value = product.name;
                document.getElementById('editProductDescription').value = product.description;
                document.getElementById('editProductCategory').value = product.category_name;
                
                // Clear existing weight variants
                document.querySelectorAll('.variant-card input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                    const priceInput = checkbox.closest('.variant-card').querySelector('input[name^="price_"]');
                    const stockInput = checkbox.closest('.variant-card').querySelector('input[name^="stock_"]');
                    priceInput.value = '';
                    stockInput.value = '';
                    priceInput.disabled = true;
                    stockInput.disabled = true;
                });
                
                // Populate weight variants
                const weights = product.weights;
                weights.forEach(weight => {
                    const checkbox = document.getElementById(`editWeight${weight.value}${weight.unit}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        const priceInput = checkbox.closest('.variant-card').querySelector(`input[name="price_${weight.value}${weight.unit}"]`);
                        const stockInput = checkbox.closest('.variant-card').querySelector(`input[name="stock_${weight.value}${weight.unit}"]`);
                        priceInput.value = weight.price;
                        stockInput.value = weight.stock;
                        priceInput.disabled = false;
                        stockInput.disabled = false;
                    }
                });

                // Set the current image
                const imagePreview = document.getElementById('editImagePreview');
                imagePreview.src = product.image_url.startsWith('/') ? product.image_url : '/' + product.image_url;
                document.getElementById('editImagePreviewContainer').style.display = 'block';

                showModal('editProductModal');
            })
            .catch(error => console.error('Error fetching product details:', error));
    });
});

function showError(input, message) {
    let errorMessage = input.parentElement.querySelector('.error-message');
    if (!errorMessage) {
        errorMessage = document.createElement('small');
        errorMessage.classList.add('error-message');
        input.parentElement.appendChild(errorMessage);
    }
    errorMessage.textContent = message;
    input.classList.add('input-error');
}

function clearError(input) {
    const errorMessage = input.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.textContent = '';
    }
    input.classList.remove('input-error');
}

function validateInput(input, message, maxLength = null) {
    if (input.value.trim() === '') {
        showError(input, message);
        return false;
    } 
    if (maxLength && input.value.length > maxLength) {
        showError(input, `Maximum ${maxLength} characters allowed.`);
        return false;
    }
    clearError(input);
    return true;
}

function validateWeightVariants() {
    const variantCards = document.querySelectorAll('.variant-card');
    let isChecked = false; // Flag to check if at least one checkbox is selected
    let hasValidPrice = true; // Flag to check if selected weights have valid prices

    variantCards.forEach(variant => {
        const checkbox = variant.querySelector('input[type="checkbox"]');
        const priceInput = variant.querySelector('input[name^="price_"]');

        if (checkbox.checked) {
            isChecked = true; // At least one checkbox is checked
            if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
                showError(priceInput, 'Enter a valid price.');
                hasValidPrice = false;
            } else {
                clearError(priceInput);
            }
        } else {
            clearError(priceInput); // Clear error if unchecked
        }
    });

    const errorContainer = document.querySelector('.weight-variants .error-message');

    if (!isChecked) {
        errorContainer.textContent = 'Select at least one weight variant.';
        return false;
    } else if (!hasValidPrice) {
        errorContainer.textContent = 'Ensure selected variants have valid prices.';
        return false;
    } else {
        errorContainer.textContent = ''; // Clear error when at least one valid variant is selected
        return true;
    }
}


const nameInput = document.querySelector('#editProductName');
const createNameInput = document.querySelector('#productName');
nameInput.addEventListener('input', () => validateInput(nameInput, 'Product name is required.', 70));
createNameInput.addEventListener('input', () => validateInput(createNameInput, 'Product name is required.', 70));

const descriptionInput = document.querySelector('#editProductDescription');
const createDescriptionInput = document.querySelector('#productDescription');
descriptionInput.addEventListener('input', () => validateInput(descriptionInput, 'Description is required.', 2000));
createDescriptionInput.addEventListener('input', () => validateInput(createDescriptionInput, 'Description is required.', 2000));

const categoryInput = document.querySelector('#editProductCategory');
const createCategoryInput = document.querySelector('#productCategory');
categoryInput.addEventListener('change', () => validateInput(categoryInput, 'Please select a category.'));
createCategoryInput.addEventListener('change', () => validateInput(createCategoryInput, 'Please select a category.'));

// Validate price fields for checked weight variants
document.querySelectorAll('.variant-card').forEach(variant => {
    const checkbox = variant.querySelector('input[type="checkbox"]');
    const priceInput = variant.querySelector('input[name^="price_"]');

    priceInput.addEventListener('input', () => {
        if (checkbox.checked) {
            if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
                showError(priceInput, 'Enter a valid price.');
            } else {
                clearError(priceInput);
            }
        } else{
            validateWeightVariants();
        }
    });
    // Remove error when checkbox is unchecked
    checkbox.addEventListener('change', () => {
        if (!checkbox.checked) {
            clearError(priceInput);
        }
    });
});

// Function to handle the form submission for editing a product
document.querySelector('.edit-form').addEventListener('submit', function (e) {
    e.preventDefault();
    let isValid = true;

    if (!validateInput(nameInput, 'Product name is required.', 70)) isValid = false;
    if (!validateInput(descriptionInput, 'Description is required.', 2000)) isValid = false;
    if (!validateInput(categoryInput, 'Please select a category.')) isValid = false;
    if (!validateWeightVariants()) isValid = false;
    document.querySelectorAll('.variant-card').forEach(variant => {
        const checkbox = variant.querySelector('input[type="checkbox"]');
        const priceInput = variant.querySelector('input[name^="price_"]');

        if (checkbox.checked) {
            if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
                showError(priceInput, 'Enter a valid price.');
                isValid = false;
            }
        }
    });

    if (!isValid) return;

    const formData = new FormData(this);
    const weights = [];

    document.querySelectorAll('.variant-card').forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox.checked) {
            const weight = {
                weight_id: checkbox.value,
                price: card.querySelector(`input[name="price_${checkbox.value}"]`).value,
                stock: card.querySelector(`input[name="stock_${checkbox.value}"]`).value
            };
            weights.push(weight);
        }
    });

    formData.append('weights', JSON.stringify(weights));

    fetch('/dashboard/edit-product', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideModal('editProductModal');
            Toast.show(data.message,'success');
        } else {
            Toast.show('Error updating product. Please try again.', 'error');
        }
    })
    .catch(error => console.error('Error updating product:', error));
});


// Function to handle the form submission for adding a product
document.querySelector('.add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    let isValid = true;

    if (!validateInput(createNameInput, 'Product name is required.', 70)) isValid = false;
    if (!validateInput(createDescriptionInput, 'Description is required.', 2000)) isValid = false;
    if (!validateInput(createCategoryInput, 'Please select a category.')) isValid = false;
    if (!validateWeightVariants()) isValid = false;
    document.querySelectorAll('.variant-card').forEach(variant => {
        const checkbox = variant.querySelector('input[type="checkbox"]');
        const priceInput = variant.querySelector('input[name^="price_"]');

        if (checkbox.checked) {
            if (!priceInput.value || parseFloat(priceInput.value) <= 0) {
                showError(priceInput, 'Enter a valid price.');
                isValid = false;
            }
        }
    });
    if (!isValid) return;
    console.error(isValid);

    const formData = new FormData(this);
    const weights = [];

    document.querySelectorAll('.variant-card').forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox.checked) {
            const weight = {
                weight_id: checkbox.value,
                price: card.querySelector(`input[name="price_${checkbox.value}"]`).value,
                stock: card.querySelector(`input[name="stock_${checkbox.value}"]`).value
            };
            weights.push(weight);
        }
    });
    
    formData.delete("weights"); // Ensure no duplicate
    formData.append('weights', JSON.stringify(weights));
    
    fetch('/dashboard/products/add', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            hideModal('addProductModal');
            Toast.show(data.message,'success');
        } else {
            Toast.show('Error adding product. Please try again.', 'error');
        }
    })
    .catch(error => console.error('Error adding product:', error));
});

// Delete confirmation
document.querySelector('#deleteModal .delete-btn').addEventListener('click', () => {
    hideModal('deleteModal');
    showNotification();
});


let lastSelectedFile = null;
const errorContainer = document.querySelector('#imageError');
errorContainer.textContent = "Product image is required.";
// Function to show the preview of the selected image
function previewImage(event) {
    const file = event.target.files[0];
    const input = event.target;
    const previewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');

    if (!file) {
        if (lastSelectedFile) {
            input.files = lastSelectedFile; // Restore the previous file
        }
        return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        if (errorContainer) errorContainer.textContent = "Invalid file type. Allowed: JPG, PNG, WEBP.";
        input.value = ''; // Clear input field
        previewContainer.style.display = 'none';
        return;
    }

    if (errorContainer) errorContainer.textContent = ""; // Clear error when valid

    // Show image preview
    const reader = new FileReader();
    reader.onload = function (e) {
        imagePreview.src = e.target.result;
        previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Attach event listener to file input
const imageInput = document.getElementById("productImage");
if (imageInput) {
    imageInput.addEventListener("change", previewImage);
}


// Delete confirmation
document.querySelectorAll('.delete-product').forEach(button => {
    button.addEventListener('click', function () {
        // Get the product ID from the data-id attribute
        const productId = this.dataset.id;

        // Show the modal
        showModal('deleteModal');

        // Attach event listener to confirm delete button
        const confirmDeleteButton = document.querySelector('.delete-btn');
        confirmDeleteButton.addEventListener('click', function () {
            // Send DELETE request to the server
            fetch(`/dashboard/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // If successful, remove the product card from the UI
                        const productCard = button.closest('.product-card');
                        productCard.remove();

                        // Show success notification
                        showNotification();
                    } else {
                        // Handle failure case
                        Toast.show('Failed to delete product. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Toast.show('Failed to delete product. Please try again.');
                });

            // Close the modal
            hideModal('deleteModal');
        });
    });
});

document.querySelectorAll('.return-product').forEach(button => {
    button.addEventListener('click', function () {
        const productId = this.dataset.id;
        if (confirm('Are you sure you want to return this product?')) {
            fetch(`/dashboard/products/${productId}/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Toast.show('Product have been returned successfully!', 'success', () => {
                        window.location.reload();
                    });
                } else {
                    Toast.show('Failed to return product. Please try again.', 'error');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });
});
