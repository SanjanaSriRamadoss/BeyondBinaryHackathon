// Edit Activity JavaScript
const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const checkAuth = () => {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

let currentActivity = null;
let activityId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    const urlParams = new URLSearchParams(window.location.search);
    activityId = urlParams.get('id');

    if (!activityId) {
        alert('No activity ID provided');
        window.location.href = 'dashboard.html';
        return;
    }

    await loadActivity();
    setupEventListeners();
});

function setupEventListeners() {
    const descriptionTextarea = document.getElementById('description');
    const charCount = document.querySelector('.char-count');
    
    descriptionTextarea?.addEventListener('input', () => {
        const count = descriptionTextarea.value.length;
        charCount.textContent = `${count} / 1000`;
    });

    const form = document.getElementById('updateActivityForm');
    form?.addEventListener('submit', handleSubmit);

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    document.getElementById('maxParticipants')?.addEventListener('input', validateMaxParticipants);
}

async function loadActivity() {
    const loadingState = document.getElementById('loadingState');
    const editForm = document.getElementById('editForm');

    try {
        const response = await fetch(`${API_URL}/activities/${activityId}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentActivity = data.data;
            populateForm(currentActivity);
            
            loadingState.style.display = 'none';
            editForm.style.display = 'block';
        } else {
            throw new Error('Failed to load activity');
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        alert('Failed to load activity. Redirecting to dashboard.');
        window.location.href = 'dashboard.html';
    }
}

function populateForm(activity) {
    document.getElementById('title').value = activity.title;
    document.getElementById('category').value = activity.category;
    document.getElementById('description').value = activity.description;
    document.getElementById('interests').value = activity.interests?.join(', ') || '';
    
    const activityDate = new Date(activity.date);
    document.getElementById('date').value = activityDate.toISOString().split('T')[0];
    
    document.getElementById('time').value = activity.time;
    document.getElementById('duration').value = activity.duration;
    document.getElementById('address').value = activity.location.address;
    document.getElementById('city').value = activity.location.city;
    document.getElementById('maxParticipants').value = activity.maxParticipants;
    document.getElementById('status').value = activity.status;
    document.getElementById('isPublic').checked = activity.isPublic;

    const charCount = document.querySelector('.char-count');
    charCount.textContent = `${activity.description.length} / 1000`;

    updateParticipantNote(activity.currentParticipants);

    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
}

function updateParticipantNote(currentParticipants) {
    const note = document.getElementById('participantNote');
    note.textContent = `Current participants: ${currentParticipants}. Cannot set below this number.`;
}

function validateMaxParticipants() {
    const maxParticipants = parseInt(document.getElementById('maxParticipants').value);
    const currentParticipants = currentActivity?.currentParticipants || 1;

    if (maxParticipants < currentParticipants) {
        document.getElementById('maxParticipants').value = currentParticipants;
        alert(`Cannot reduce max participants below current participant count (${currentParticipants})`);
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    clearErrors();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    try {
        const formData = getFormData();
        
        if (!validateForm(formData)) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Activity';
            return;
        }

        const response = await fetch(`${API_URL}/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Activity updated successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            if (data.errors) {
                displayServerErrors(data.errors);
            } else {
                showMessage(data.message || 'Failed to update activity', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Activity';
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Activity';
    }
}

function getFormData() {
    const interests = document.getElementById('interests').value
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

    return {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value,
        interests: interests,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        duration: parseInt(document.getElementById('duration').value) || 60,
        location: {
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim()
        },
        maxParticipants: parseInt(document.getElementById('maxParticipants').value),
        status: document.getElementById('status').value,
        isPublic: document.getElementById('isPublic').checked
    };
}

function validateForm(data) {
    let isValid = true;

    if (data.title.length < 3 || data.title.length > 100) {
        showError('title', 'Title must be between 3 and 100 characters');
        isValid = false;
    }

    if (data.description.length < 10 || data.description.length > 1000) {
        showError('description', 'Description must be between 10 and 1000 characters');
        isValid = false;
    }

    if (!data.category) {
        showError('category', 'Please select a category');
        isValid = false;
    }

    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showError('date', 'Activity date must be in the future');
        isValid = false;
    }

    if (!data.time) {
        showError('time', 'Please select a time');
        isValid = false;
    }

    if (!data.location.address) {
        showError('address', 'Address is required');
        isValid = false;
    }

    if (!data.location.city) {
        showError('city', 'City is required');
        isValid = false;
    }

    return isValid;
}

function showError(fieldId, message) {
    const errorSpan = document.getElementById(`${fieldId}-error`);
    const field = document.getElementById(fieldId);
    
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.style.display = 'block';
    }
    
    if (field) {
        field.classList.add('error');
    }
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.textContent = '';
        msg.style.display = 'none';
    });

    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));

    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = '';
    formMessage.className = 'form-message';
}

function displayServerErrors(errors) {
    errors.forEach(error => {
        const fieldName = error.param || error.path;
        if (fieldName) {
            showError(fieldName, error.msg);
        }
    });
}

function showMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
