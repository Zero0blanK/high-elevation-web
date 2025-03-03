function showNewAddressRow() {
    const tbody = document.querySelector('.address-table tbody');
    const template = `
        <tr id="newAddressRow">
            <td class="add-mode"><input type="text" value="${document.getElementById('userName').value}" readonly></td>
            <td class="add-mode">
                <input type="text" name="street_address" placeholder="Street Address" required>
                <input type="text" name="apartment" placeholder="Apartment (optional)">
                <input type="text" name="city" placeholder="City" required>
            </td>
            <td class="add-mode"><input type="text" name="zip_code" placeholder="Postal Code" required></td>
            <td class="add-mode"><input type="text" value="${document.getElementById('userPhone').value}" readonly></td>
            <td class="add-mode">
                <label>
                    <input type="checkbox" name="is_default"> Set as default
                </label>
            </td>
            <td class="add-mode">
                <button type="button" onclick="showConfirmationModal('add')" class="save-btn">Save</button>
                <button type="button" onclick="hideNewAddressRow()" class="cancel-btn">Cancel</button>
            </td>
        </tr>
    `;
    
    // Remove existing new address row if any
    const existingRow = document.getElementById('newAddressRow');
    if (existingRow) existingRow.remove();
    
    // Add new row
    tbody.insertAdjacentHTML('beforeend', template);
}

function hideNewAddressRow() {
    document.getElementById('newAddressRow').style.display = 'none';
    // Clear form fields
    document.querySelector('[name="street_address"]').value = '';
    document.querySelector('[name="apartment"]').value = '';
    document.querySelector('[name="city"]').value = '';
    document.querySelector('[name="zip_code"]').value = '';
    document.querySelector('[name="is_default"]').checked = false;
}

function toggleEditMode(addressId) {
    const row = document.querySelector(`tr[data-address-id="${addressId}"]`);
    const viewFields = row.querySelectorAll('.view-mode');
    const editFields = row.querySelectorAll('.edit-mode');
    
    viewFields.forEach(field => {
        field.style.display = field.style.display === 'none' ? '' : 'none';
    });
    
    editFields.forEach(field => {
        field.style.display = field.style.display === 'none' ? '' : 'none';
    });
}

function showConfirmation(type, addressId = null) {
    const modal = document.getElementById('confirmationModal');
    const title = modal.querySelector('h3');
    const message = modal.querySelector('p');
    const confirmBtn = modal.querySelector('.modal-buttons button:first-child');
    
    if (type === 'edit') {
        title.textContent = 'Confirm Edit Address';
        message.textContent = 'Are you sure you want to save these changes?';
        confirmBtn.onclick = () => submitEditAddress(addressId);
    } else {
        title.textContent = 'Confirm New Address';
        message.textContent = 'Are you sure you want to add this address?';
        confirmBtn.onclick = submitNewAddress;
    }
    
    modal.style.display = 'block';
}
function showConfirmationModal(type, addressId = null) {
    const modal = document.getElementById('confirmationModal');
    const title = modal.querySelector('h3');
    const message = modal.querySelector('p');
    const confirmBtn = modal.querySelector('#confirmButton');
    
    if (type === 'edit') {
        title.textContent = 'Confirm Edit Address';
        message.textContent = 'Are you sure you want to save these changes?';
        confirmBtn.setAttribute('onclick', `submitEditAddress('${addressId}')`);
    } else {
        title.textContent = 'Confirm New Address';
        message.textContent = 'Are you sure you want to add this address?';
        confirmBtn.setAttribute('onclick', 'submitNewAddress()');
    }
    
    modal.style.display = 'block';
}

function hideConfirmation() {
    document.getElementById('confirmationModal').style.display = 'none';
}

function submitNewAddress() {
    // Get form elements first
    const streetAddress = document.querySelector('[name="street_address"]');
    const apartment = document.querySelector('[name="apartment"]');
    const city = document.querySelector('[name="city"]');
    const zipCode = document.querySelector('[name="zip_code"]');
    const isDefault = document.querySelector('[name="is_default"]');

    // Log values for debugging
    console.log('Form Values:', {
        street: streetAddress.value,
        apartment: apartment.value,
        city: city.value,
        zip_code: zipCode.value,
        isDefault: isDefault.checked
    });

    const formData = {
        street_address: streetAddress.value,
        apartment: apartment.value || '',
        city: city.value,
        zip_code: zipCode.value,  // Make sure this matches the backend field name
        is_default: isDefault.checked
    };
    
    // Validate required fields
    if (!streetAddress.value || !city.value || !zipCode.value) {
        alert('Please fill in all required fields');
        return;
    }

    fetch('/profile/address/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            window.location.reload();
        } else {
            throw new Error('Failed to add address');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to add address. Please try again.');
    });
}

function submitEditAddress(addressId) {
    const row = document.querySelector(`tr[data-address-id="${addressId}"]`);
    const formData = {
        street_address: row.querySelector('[name="street_address"]').value,
        apartment: row.querySelector('[name="apartment"]').value,
        city: row.querySelector('[name="city"]').value,
        zip_code: row.querySelector('[name="zip_code"]').value,
        is_default: row.querySelector('[name="is_default"]').checked
    };

    fetch(`/profile/address/edit/${addressId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) window.location.reload();
        else throw new Error('Failed to update address');
    })
    .catch(error => {
        console.error('Error:', error);
        alert(error.message);
    });
}

// Add to profileAddress.js
function handleDefaultChange(checkbox, addressId) {
    if (checkbox.checked) {
        // Uncheck all other default checkboxes
        document.querySelectorAll('[name="is_default"]').forEach(cb => {
            if (cb !== checkbox) cb.checked = false;
        });
    }
}