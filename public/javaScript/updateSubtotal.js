let isUpdating = false;
let updateQueue = false;

// Debounce function to prevent rapid successive calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Function to update the subtotal on the frontend
function updateSubtotal() {
    let subtotal = 0;
    document.querySelectorAll('.cart-items tbody tr').forEach(row => {
        const quantity = parseInt(row.querySelector('.quantity-input').value);
        const price = parseFloat(row.querySelector('.product-price h4').innerText.replace('₱', ''));
        subtotal += quantity * price;
    });
    // Update the subtotal element
    const subtotalElement = document.querySelector('.subtotal h2');
    if (subtotalElement) {
        subtotalElement.innerText = '₱' + subtotal.toFixed(2) + ' php';
    }
}

// Debounced version of cart update function
const updateCartItem = debounce(async function(product_id, weight_id, quantity) {
    if (isUpdating) {
        updateQueue = {product_id, weight_id, quantity};
        return;
    }
    
    isUpdating = true;
    try {
        const response = await fetch('/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id, weight_id, quantity })
        });

        const result = await response.json();
        if (!result.success) {
            alert('Error updating quantity');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
    } finally {
        isUpdating = false;
        // If there was a queued update, process it now
        if (updateQueue) {
            const {product_id, weight_id, quantity} = updateQueue;
            updateQueue = false;
            updateCartItem(product_id, weight_id, quantity);
        }
    }
}, 300); // 300ms debounce time

// Event listener for when the quantity is manually changed by the user
document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', function (e) {
        const row = e.target.closest('tr');
        const product_id = row.getAttribute('data-product-id');
        const weight_id = row.getAttribute('data-weight-id');
        let quantity = parseInt(e.target.value); // Get the new quantity

        // Check that the quantity is a valid number (and >= 1)
        if (isNaN(quantity) || quantity < 1) {
            alert('Invalid quantity!');
            return;
        }

        // Update the total for the individual product
        const price = parseFloat(row.querySelector('.product-price h4').innerText.replace('₱', ''));
        row.querySelector('.total-amount').innerText = '₱' + (quantity * price).toFixed(2);
        
        // Recalculate the subtotal immediately after updating the quantity
        updateSubtotal();
        
        // Send the updated quantity to the backend
        updateCartItem(product_id, weight_id, quantity);
    });
});

// Event listener for quantity increase/decrease buttons
document.querySelectorAll('.quantity-btn').forEach(button => {
    button.addEventListener('click', function (e) {
        const input = e.target.closest('.quantity-btn-container').querySelector('.quantity-input');
        let quantity = parseInt(input.value);

        // Adjust the quantity based on the button clicked (Increase/Decrease)
        if (e.target.getAttribute('aria-label') === 'Increase quantity' && quantity < 20) {
            quantity++;
        } else if (e.target.getAttribute('aria-label') === 'Decrease quantity' && quantity > 1) {
            quantity--;
        } else {
            return; // No change needed
        }

        input.value = quantity;

        const row = e.target.closest('tr');
        const product_id = row.getAttribute('data-product-id');
        const weight_id = row.getAttribute('data-weight-id');
        const price = parseFloat(row.querySelector('.product-price h4').innerText.replace('₱', ''));
        row.querySelector('.total-amount').innerText = '₱' + (quantity * price).toFixed(2);

        // Recalculate the subtotal immediately after updating the quantity
        updateSubtotal();

        // Send the updated quantity to the backend
        updateCartItem(product_id, weight_id, quantity);
    });
});

// Event listener for remove buttons
document.querySelectorAll('.removeButton').forEach(button => {
    button.addEventListener('click', async function (e) {
        if (isUpdating) return; // Don't allow removing while updating
        isUpdating = true;
        
        try {
            const row = e.target.closest('tr');
            const product_id = row.getAttribute('data-product-id');
            const weight_id = row.getAttribute('data-weight-id');

            const response = await fetch('/cart/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id, weight_id })
            });

            const result = await response.json();
            if (result.success) {
                row.remove(); // Remove the row from the cart view
                updateSubtotal();
            } else {
                alert('Error removing item');
            }
        } catch (error) {
            console.error('Error removing item:', error);
        } finally {
            isUpdating = false;
            location.reload();
        }
    });
});

