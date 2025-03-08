// Enable/disable variant inputs based on checkbox
document.querySelectorAll('input[type="checkbox"][name="weights"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        const variantCard = this.closest('.variant-card');
        const inputs = variantCard.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.disabled = !this.checked;
            if (!this.checked) {
                input.value = '';
            }
        });
    });
});

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

const addProductBtn = document.querySelector(".add-order-btn");

if (addProductBtn) {
    addProductBtn.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent unintended modal behavior
        window.location.href = "/dashboard/products/add";
    });
}


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

// Function to handle the form submission for editing a product
document.querySelector('.edit-form').addEventListener('submit', function (event) {
    event.preventDefault();

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
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Failed to update product. Please try again.');
        }
    })
    .catch(error => console.error('Error updating product:', error));
});

// Delete confirmation
document.querySelector('#deleteModal .delete-btn').addEventListener('click', () => {
    hideModal('deleteModal');
    showNotification();
});

// Function to show the preview of the selected image
function previewImage(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');

    // Only proceed if a file is selected and it is an image
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = function (e) {
            imagePreview.src = e.target.result; // Set the source of the image preview
            previewContainer.style.display = 'block'; // Show the preview container
        };

        reader.readAsDataURL(file); // Read the selected file as a data URL
    } else {
        // Hide the preview container if the file is not an image
        previewContainer.style.display = 'none';
    }
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
