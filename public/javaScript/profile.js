const editButton = document.getElementById('edit-button');
const profileForm = document.getElementById('profile-form');
const inputs = document.querySelectorAll('#profile-form input');
const profileUpload = document.getElementById('profile-upload');
const profileImage = document.getElementById('profile-image');
const togglePassword = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');

let isEditing = false;

// Profile image preview
profileUpload.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            profileImage.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

// Edit button handler
editButton.addEventListener('click', function() {
    if (!isEditing) {
        // Enable editing mode
        enableEditMode();
    } else {
        // Save changes
        submitForm();
    }
});

function enableEditMode() {
    inputs.forEach(input => {
        if (input.id !== 'email') { // Keep email disabled
            input.disabled = false;
        }
    });
    editButton.textContent = 'Save Changes';
    togglePassword.style.display = 'block';
    isEditing = true;
}

function disableEditMode() {
    inputs.forEach(input => {
        input.disabled = true;
    });
    editButton.textContent = 'Edit Profile';
    togglePassword.style.display = 'none';
    passwordInput.type = 'password';
    togglePassword.querySelector('i').className = 'fas fa-eye';
    isEditing = false;
}

function submitForm() {
    const formData = new FormData();
    
    formData.append('first_name', document.getElementById('first-name').value);
    formData.append('last_name', document.getElementById('last-name').value);
    formData.append('contact_number', document.getElementById('phone').value);
    formData.append('password', passwordInput.value);

    if (profileUpload.files[0]) {
        formData.append('profile_pic', profileUpload.files[0]);
    }

    fetch('/profile/update', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (data.profileUrl) {
                profileImage.src = data.profileUrl;
            }
            disableEditMode();
            alert('Profile updated successfully!');
        } else {
            throw new Error(data.error || 'Update failed');
        }
    })
    .catch(error => {
        console.error('Update error:', error);
        alert('Failed to update profile: ' + error.message);
    });
}

// Password visibility toggle
togglePassword.addEventListener('click', function() {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

// Initialize state
disableEditMode();