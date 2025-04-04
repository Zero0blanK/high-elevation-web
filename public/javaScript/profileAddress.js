function showNewAddressRow() {
    const tbody = document.querySelector('.address-table tbody');
    const template = `
        <tr id="newAddressRow">
            <td class="add-mode"><input type="text" id="new-fullname" value="${document.getElementById('userName').value}" readonly></td>
            <td class="add-mode">
                <input type="text" id="new-street-address" name="new_street_address" placeholder="Street Address" required>
                <input type="text" id="new-apartment" name="new_apartment" placeholder="Apartment (optional)">
                <input type="text" id="new-city" name="new_city" placeholder="City" required>
            </td>
            <td class="add-mode"><input type="text" id="new-zip-code" name="new_zip_code" placeholder="Postal Code" required></td>
            <td class="add-mode"><input type="text" id="new-phone" value="${document.getElementById('userPhone').value}" readonly></td>
            <td class="add-mode">
                <label>
                    <input type="checkbox" id="new-is-default" name="new_is_default"> Set as default
                </label>
            </td>
            <td class="add-mode">
                <div class="button-container" style="display: flex; gap: 8px;">
                    <button type="button" onclick="showConfirmationModal('add')" class="save-btn">
                        <i class="fas fa-save" style="margin-right: 4px;"></i> Save
                    </button>
                    <button type="button" onclick="hideNewAddressRow()" class="cancel-btn">
                        <i class="fas fa-times" style="margin-right: 4px;"></i> Cancel
                    </button>
                </div>
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
        confirmBtn.setAttribute('onclick', `submitEditAddress('${addressId}')`);
    } else {
        title.textContent = 'Confirm New Address';
        message.textContent = 'Are you sure you want to add this address?';
        confirmBtn.setAttribute('onclick', 'submitNewAddress()');
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
    const streetAddress = document.getElementById('new-street-address');
    const apartment = document.getElementById('new-apartment');
    const city = document.getElementById('new-city');
    const zipCode = document.getElementById('new-zip-code');
    const isDefault = document.getElementById('new-is-default');

    // Validate required fields
    if (!streetAddress.value || !city.value || !zipCode.value) {
        Toast.show('Please fill in all required fields', 'error');
        return;
    }
    
    const formData = {
        street_address: streetAddress.value,
        apartment: apartment.value || '',
        city: city.value,
        zip_code: zipCode.value,
        is_default: isDefault.checked
    };

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
        Toast.show('Failed to add address. Please try again.');
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