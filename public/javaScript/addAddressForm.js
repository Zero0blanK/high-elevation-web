function submitAddressForm(event) {
    event.preventDefault(); // Prevent page reload
    const form = document.getElementById('addAddressForm');
    const formData = new FormData(form);

    fetch('/add-address', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert("Address added successfully");
        location.reload(); // Reload to reflect new address
    })
    .catch(error => console.error('Error:', error));
}