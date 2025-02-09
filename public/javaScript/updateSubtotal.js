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

// Event listener for when the quantity is manually changed by the user
document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', async function (e) {
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
        const response = await fetch('/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id, weight_id, quantity })
        });

        const result = await response.json();
        if (!result.success) {
            alert('Error updating quantity');
        }

    });
});

// Event listener for quantity increase/decrease buttons
document.querySelectorAll('.quantity-btn').forEach(button => {
    button.addEventListener('click', async function (e) {
        const input = e.target.closest('.quantity-btn-container').querySelector('.quantity-input');
        let quantity = parseInt(input.value);

        // Adjust the quantity based on the button clicked (Increase/Decrease)
        if (e.target.getAttribute('aria-label') === 'Increase quantity' && quantity < 20) {
            quantity++;
        } else if (e.target.getAttribute('aria-label') === 'Decrease quantity' && quantity > 1) {
            quantity--;
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
        const response = await fetch('/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id, weight_id, quantity })
        });

        const result = await response.json();
        if (!result.success) {
            alert('Error updating quantity');
        }

    });
});


document.querySelectorAll('.removeButton').forEach(button => {
    button.addEventListener('click', async function (e) {
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
        } else {
            alert('Error removing item');
        }
        updateSubtotal();
    });
});