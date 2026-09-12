const profileStorageKey = 'lifelinkProfile';
const profileFields = ['name', 'age', 'bloodGroup', 'height', 'weight', 'waterGoal', 'exerciseGoal', 'contactName', 'phoneNumber'];

function loadProfile() {
    const profile = JSON.parse(localStorage.getItem(profileStorageKey) || '{}');

    profileFields.forEach((fieldId) => {
        const field = document.querySelector(`#${fieldId}`);
        if (field && profile[fieldId] !== undefined) {
            field.value = profile[fieldId];
        }
    });

    const profileName = document.querySelector('#profileName');
    if (profileName && profile.name) {
        profileName.textContent = profile.name;
    }
}

function saveProfile() {
    const profile = JSON.parse(localStorage.getItem(profileStorageKey) || '{}');
    const ageField = document.querySelector('#age');
    const phoneField = document.querySelector('#phoneNumber');
    const formStatus = document.querySelector('#profileStatus');

    if (ageField && !ageField.checkValidity()) {
        formStatus.textContent = 'Please enter an age between 1 and 120.';
        ageField.focus();
        return;
    }

    if (phoneField && !phoneField.checkValidity()) {
        formStatus.textContent = 'Please enter a valid emergency phone number.';
        phoneField.focus();
        return;
    }

    profileFields.forEach((fieldId) => {
        const field = document.querySelector(`#${fieldId}`);
        if (field) {
            profile[fieldId] = field.value.trim();
        }
    });

    localStorage.setItem(profileStorageKey, JSON.stringify(profile));

    const profileName = document.querySelector('#profileName');
    if (profileName && profile.name) {
        profileName.textContent = profile.name;
    }
    if (formStatus) {
        formStatus.textContent = 'Profile saved locally.';
    }
}

loadProfile();
