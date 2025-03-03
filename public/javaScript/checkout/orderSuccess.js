let countdownInterval;
function showOrderSuccessModal(orderId) {
    const modal = document.getElementById('orderSuccessModal');
    const orderNumberDisplay = document.getElementById('orderNumberDisplay');
    
    // Set the order number
    orderNumberDisplay.textContent = orderId;
    
    // Show the modal
    modal.style.display = 'block';
    
    // Prevent scrolling on the background
    document.body.style.overflow = 'hidden';

    // Start countdown from 10
    let timeLeft = 10;
    countdownDisplay.textContent = timeLeft;

    countdownInterval = setInterval(() => {
        timeLeft--;
        countdownDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            window.location.href = '/';
        }
    }, 1000);

}

function closeOrderModal() {
    const modal = document.getElementById('orderSuccessModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    clearInterval(countdownInterval);
}

// Update button click handlers
document.querySelector('.view-order-btn').onclick = function() {
    clearInterval(countdownInterval);
    closeOrderModal();
    window.location.href = '/profile/orders';
};

document.querySelector('.continue-shopping-btn').onclick = function() {
    clearInterval(countdownInterval);
    closeOrderModal();
    window.location.href = '/product';
};