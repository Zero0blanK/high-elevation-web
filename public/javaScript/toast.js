class Toast {
    static show(message, type = 'success', onClose = null) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? '✓' : '⚠';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                container.removeChild(toast);
                if (onClose && typeof onClose === 'function') {
                    onClose(); // Execute the callback (e.g., reload)
                }
            }, 300);
        }, 3000);
    }
}
